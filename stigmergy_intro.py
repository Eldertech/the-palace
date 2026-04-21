#!/usr/bin/env python3
"""
STIGMERGY  ::  Palace Underground BBS
Opening screen — cracked by: TRICKSTER

Run directly:   python3 stigmergy_intro.py
Requires:       Python 3.x, standard library only (curses)
Optional:       pip install pyfiglet  (for alt logo variants)

Layout assumes minimum 80×22 terminal.
Press any key from the main screen to exit.
"""

import curses
import time
import sys


# ─────────────────────────────────────────────────────────────────────────────
#  LOGO  (doom font via pyfiglet; hardcoded fallback)
# ─────────────────────────────────────────────────────────────────────────────

try:
    import pyfiglet
    _fig = pyfiglet.Figlet(font="slant")
    _raw = _fig.renderText("STIGMERGY")
    LOGO = [ln for ln in _raw.splitlines() if ln.strip()]
except ImportError:
    LOGO = [
        r" _____ _____ _____ _____ ___  ___ ___________ _______   __",
        r"/  ___|_   _|_   _|  __ \|  \/  ||  ___| ___ \  __ \ \ / /",
        r"\ `--.  | |   | | | |  \/| .  . || |__ | |_/ / |  \/\ V / ",
        r" `--. \ | |   | | | | __ | |\/| ||  __||    /| | __  \ /  ",
        r"/\__/ / | |  _| |_| |_\ \| |  | || |___| |\ \| |_\ \ | |  ",
        r"\____/  \_/  \___/ \____/\_|  |_/\____/\_| \_|\____/ \_/  ",
    ]


# ─────────────────────────────────────────────────────────────────────────────
#  CRACK ATTRIBUTION
# ─────────────────────────────────────────────────────────────────────────────

CRACK_LINES = [
    "┌─────────────────────────────────────────────────────────────┐",
    "│  c r a c k e d  b y :   T  R  I  C  K  S  T  E  R           │",
    "│  palace underground bbs  ·  anno domini mmxxvi              │",
    "└─────────────────────────────────────────────────────────────┘",
]

# ─────────────────────────────────────────────────────────────────────────────
#  FLAVOR TEXT
# ─────────────────────────────────────────────────────────────────────────────

FLAVOR_LINES = [
    "  stigmergy  [ n. ]  indirect coordination through environmental traces —",
    "  the swarm has no conductor.  the trace is the message.",
    "  TRICKSTER found the pattern.  the palace is open.",
]

PRESS_KEY = "[ press any key to enter the palace ]"

# ─────────────────────────────────────────────────────────────────────────────
#  TICKER
# ─────────────────────────────────────────────────────────────────────────────

TICKER = (
    "  >>>  STIGMERGY  ::  the indirect coordination of many has been cracked  "
    ":::  leave traces in the environment  :::  let the swarm read them  "
    ":::  no center  :::  no director  :::  only marks  :::  only stigmergy  "
    ":::  greets to: all nodes  :::  all philosophers  :::  all musicians  "
    ":::  all creative technologists  :::  the palace is open  "
    ":::  TRICKSTER was here  :::  and then wasn't  :::  that's the whole point  "
    ":::  "
)

# ─────────────────────────────────────────────────────────────────────────────
#  COLOR PAIRS
# ─────────────────────────────────────────────────────────────────────────────

CP_FRAME   = 1   # cyan  — outer box
CP_LOGO    = 2   # cyan bold — STIGMERGY text
CP_CRACK   = 3   # yellow bold — attribution box
CP_SUBTEXT = 4   # cyan dim — flavor / dividers
CP_TEXT    = 5   # white — readable prose
CP_TICKER  = 6   # green — bottom scroller
CP_PROMPT  = 7   # white dim — press-any-key


def setup_colors():
    curses.start_color()
    curses.use_default_colors()
    bg = -1
    curses.init_pair(CP_FRAME,   curses.COLOR_CYAN,   bg)
    curses.init_pair(CP_LOGO,    curses.COLOR_CYAN,   bg)
    curses.init_pair(CP_CRACK,   curses.COLOR_YELLOW, bg)
    curses.init_pair(CP_SUBTEXT, curses.COLOR_CYAN,   bg)
    curses.init_pair(CP_TEXT,    curses.COLOR_WHITE,  bg)
    curses.init_pair(CP_TICKER,  curses.COLOR_GREEN,  bg)
    curses.init_pair(CP_PROMPT,  curses.COLOR_WHITE,  bg)


# ─────────────────────────────────────────────────────────────────────────────
#  DRAW PRIMITIVES
# ─────────────────────────────────────────────────────────────────────────────

def put(win, y, x, s, attr=0):
    """Safe addstr — silently clips to window bounds."""
    rows, cols = win.getmaxyx()
    if y < 0 or y >= rows:
        return
    if x >= cols - 1:
        return
    if x < 0:
        s = s[-x:]
        x = 0
    max_len = cols - x - 1
    if max_len <= 0:
        return
    try:
        win.addstr(y, x, s[:max_len], attr)
    except curses.error:
        pass


def hcenter(win, y, text, attr=0):
    _, cols = win.getmaxyx()
    x = max(2, (cols - len(text)) // 2)
    put(win, y, x, text, attr)


# ─────────────────────────────────────────────────────────────────────────────
#  ANIMATION SEQUENCES
# ─────────────────────────────────────────────────────────────────────────────

def anim_frame(win, delay=0.008):
    """Animate the outer frame drawing in."""
    rows, cols = win.getmaxyx()
    attr = curses.color_pair(CP_FRAME) | curses.A_BOLD

    # Top row sweeps left → right
    put(win, 0, 0, "╔", attr)
    win.refresh()
    for c in range(1, cols - 2):
        put(win, 0, c, "═", attr)
        win.refresh()
        time.sleep(delay)
    put(win, 0, cols - 2, "╗", attr)
    win.refresh()

    # Sides drop top → bottom
    for r in range(1, rows - 1):
        put(win, r, 0,        "║", attr)
        put(win, r, cols - 2, "║", attr)
        win.refresh()
        time.sleep(delay * 2)

    # Ticker divider
    put(win, rows - 3, 0, "╠" + "═" * (cols - 2) + "╣", attr)
    win.refresh()
    time.sleep(0.06)

    # Bottom row
    put(win, rows - 1, 0, "╚" + "═" * (cols - 2) + "╝", attr)
    win.refresh()
    time.sleep(0.12)


def anim_logo(win, start_y=2):
    """Drop LOGO lines in one by one, centered."""
    _, cols = win.getmaxyx()
    attr = curses.color_pair(CP_LOGO) | curses.A_BOLD
    logo_w = max(len(ln) for ln in LOGO)
    x = max(2, (cols - logo_w) // 2)

    for i, line in enumerate(LOGO):
        put(win, start_y + i, x, line, attr)
        win.refresh()
        time.sleep(0.07)

    return start_y + len(LOGO)


def anim_crack(win, y):
    """Type in the crack attribution box, centered."""
    _, cols = win.getmaxyx()
    attr = curses.color_pair(CP_CRACK) | curses.A_BOLD
    crack_w = max(len(ln) for ln in CRACK_LINES)
    x = max(2, (cols - crack_w) // 2)

    time.sleep(0.25)
    for i, line in enumerate(CRACK_LINES):
        put(win, y + i, x, line, attr)
        win.refresh()
        time.sleep(0.06)

    return y + len(CRACK_LINES)


def anim_flavor(win, y):
    """Reveal flavor text lines."""
    _, cols = win.getmaxyx()
    attr_label = curses.color_pair(CP_SUBTEXT)
    attr_punch  = curses.color_pair(CP_TEXT) | curses.A_BOLD

    time.sleep(0.2)

    # Thin divider
    put(win, y, 4, "·" * (cols - 8), attr_label)
    win.refresh()
    time.sleep(0.12)

    for i, line in enumerate(FLAVOR_LINES):
        attr = attr_punch if i == 2 else attr_label
        put(win, y + 1 + i, 4, line, attr)
        win.refresh()
        time.sleep(0.13)

    return y + 1 + len(FLAVOR_LINES)


def anim_prompt(win, y):
    """Show the press-any-key prompt, blinking."""
    rows, _ = win.getmaxyx()
    attr = curses.color_pair(CP_PROMPT) | curses.A_BLINK
    hcenter(win, y + 2, PRESS_KEY, attr)
    win.refresh()


def run_ticker(win):
    """Scroll ticker in the bottom strip until a key is pressed."""
    rows, cols = win.getmaxyx()
    row = rows - 2
    attr = curses.color_pair(CP_TICKER) | curses.A_BOLD
    width = cols - 4

    # Build looping buffer
    buf = TICKER
    while len(buf) < width * 4:
        buf += TICKER

    pos = 0
    win.nodelay(True)

    while True:
        chunk = buf[pos:pos + width]
        if len(chunk) < width:
            chunk = (chunk + buf)[:width]
        put(win, row, 2, chunk, attr)
        win.refresh()

        key = win.getch()
        if key != -1:
            break

        pos = (pos + 1) % len(TICKER)   # loop smoothly on TICKER length
        time.sleep(0.8)

    win.nodelay(False)


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────────────────────────────────

def run(stdscr):
    curses.curs_set(0)
    stdscr.clear()
    setup_colors()

    rows, cols = stdscr.getmaxyx()

    # Minimum size guard
    if rows < 22 or cols < 78:
        stdscr.addstr(0, 0,
            f"terminal too small ({cols}×{rows}) — need at least 78×22")
        stdscr.refresh()
        stdscr.getch()
        return

    # ── animate intro sequence ────────────────────────────────────────────────
    anim_frame(stdscr)

    logo_end   = anim_logo(stdscr, start_y=2)
    crack_end  = anim_crack(stdscr, y=logo_end + 1)
    flavor_end = anim_flavor(stdscr, y=crack_end + 1)
    anim_prompt(stdscr, y=flavor_end)

    # ── run ticker until keypress ─────────────────────────────────────────────
    run_ticker(stdscr)


if __name__ == "__main__":
    try:
        curses.wrapper(run)
    except KeyboardInterrupt:
        pass
