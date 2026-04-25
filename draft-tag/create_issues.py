"""
create_issues.py
----------------
Parses ISSUES.md and creates GitHub issues (with labels) via the GitHub CLI.

Usage:
  python create_issues.py            # dry run — shows what would be created
  python create_issues.py --execute  # creates labels then issues on GitHub
"""

import re
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Label colour palette  (label name -> hex, no '#')
# ---------------------------------------------------------------------------
LABEL_COLOURS: dict[str, str] = {
    'frontend-integration': 'BFD4F2',
    'enhancement':          'A2EEEF',
    'bug':                  'D73A4A',
    'documentation':        '0075CA',
    'security':             'E4E669',
    'data-integrity':       'F9D0C4',
    'tooling':              'C5DEF5',
    'dx':                   '0E8A16',
    'websockets':           '6F42C1',
    'typescript':           '1D76DB',
    'performance':          'FBCA04',
    'testing':              'E99695',
    'workers':              'B60205',
    'analytics':            'D4C5F9',
    'quality':              '5319E7',
    'observability':        '006B75',
    'infrastructure':       'EDEDED',
    'docker':               '0075CA',
    'ci-cd':                'C2E0C6',
    'database':             'F9D0C4',
    'resilience':           'BFD4F2',
    'auth':                 'D73A4A',
    'validation':           'A2EEEF',
    'refactoring':          'C5DEF5',
    'error-handling':       'E4E669',
    'dependencies':         'EDEDED',
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run_gh(cmd: list[str]) -> tuple[bool, str, str]:
    """
    Run an arbitrary gh CLI command with a 30-second timeout.
    Returns (success, stdout, stderr).
    Never raises — all errors are returned as (False, '', message).
    """
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return False, '', 'Timed out after 30 s'
    except FileNotFoundError:
        return False, '', 'gh CLI not found — install from https://cli.github.com/'


def ensure_labels(labels: set[str]) -> None:
    """
    Create or update every label on the remote repo using `gh label create --force`.
    '--force' makes the call idempotent: it updates colour/description if the label
    already exists, so it is safe to re-run.
    """
    print(f"Ensuring {len(labels)} label(s) exist on GitHub...\n")
    for label in sorted(labels):
        colour = LABEL_COLOURS.get(label, 'EDEDED')
        ok, _, err = run_gh([
            'gh', 'label', 'create', label,
            '--color', colour,
            '--force',
        ])
        status = '✓' if ok else '✗'
        suffix = '' if ok else f'  ({err})'
        print(f"  {status} {label}{suffix}")
    print()


# ---------------------------------------------------------------------------
# Parser
# ---------------------------------------------------------------------------

def parse_issues(file_path: str) -> list[dict]:
    """
    Parse ISSUES.md into a list of dicts with keys: title, labels, body.
    Each issue starts with a '### ' Markdown header.
    """
    text = Path(file_path).read_text(encoding='utf-8')

    # Split on level-3 headers; the first chunk is the document intro
    raw_blocks = text.split('\n### ')[1:]

    issues: list[dict] = []
    for block in raw_blocks:
        lines = block.split('\n')
        title = lines[0].strip()

        labels: list[str] = []
        body_lines: list[str] = []

        for line in lines[1:]:
            if line.startswith('**Labels:**'):
                raw = line.replace('**Labels:**', '').strip()
                # Prefer backtick-delimited labels; fall back to CSV
                extracted = re.findall(r'`([^`]+)`', raw)
                labels = extracted or [l.strip() for l in raw.split(',') if l.strip()]
            else:
                body_lines.append(line)

        issues.append({
            'title':  title,
            'labels': labels,
            'body':   '\n'.join(body_lines).strip(),
        })

    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    file_path = 'ISSUES.md'

    if not Path(file_path).exists():
        sys.exit(f"Error: '{file_path}' not found in the current directory.")

    print("Parsing issues from ISSUES.md...")
    issues = parse_issues(file_path)

    if not issues:
        sys.exit("No issues found. Ensure issue headers use '### '.")

    print(f"Found {len(issues)} issues.\n")

    execute = '--execute' in sys.argv

    # ── Dry-run preview ────────────────────────────────────────────────────
    if not execute:
        print("=" * 57)
        print(" DRY RUN — nothing will be changed on GitHub.")
        print(" Add '--execute' to create labels and issues.")
        print("=" * 57 + '\n')

        for i, issue in enumerate(issues, 1):
            lbl_str = ', '.join(issue['labels']) or 'none'
            print(f"[{i:02d}/{len(issues)}] {issue['title']}")
            print(f"         Labels : {lbl_str}")
            print(f"         Body   : {len(issue['body'])} chars\n")
        return

    # ── Live run ───────────────────────────────────────────────────────────
    # Step 1: create all labels first so they exist when issues reference them
    all_labels: set[str] = {lbl for issue in issues for lbl in issue['labels']}
    ensure_labels(all_labels)

    # Step 2: create issues
    created = 0
    failed  = 0

    try:
        for i, issue in enumerate(issues, 1):
            print(f"[{i:02d}/{len(issues)}] {issue['title']}")

            cmd = [
                'gh', 'issue', 'create',
                '--title', issue['title'],
                '--body',  issue['body'],
            ]
            for lbl in issue['labels']:
                cmd += ['--label', lbl]

            ok, stdout, stderr = run_gh(cmd)
            if ok:
                print(f"         ✓  {stdout}")
                created += 1
            else:
                print(f"         ✗  {stderr}")
                failed += 1

    except KeyboardInterrupt:
        print('\n\nInterrupted — stopping early.')

    total = created + failed
    print(f"\n{'=' * 40}")
    print(f"  Done: {created}/{total} issues created, {failed} failed.")
    print(f"{'=' * 40}")


if __name__ == '__main__':
    main()
