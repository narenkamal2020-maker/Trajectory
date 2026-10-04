/**
 * Language harnesses. Each is passed to the interpreter with -e / -c; the user's code and the
 * test inputs arrive on stdin as JSON, so nothing touches the filesystem.
 *
 * Protocol (stdout, one JSON object per line, prefixed with the per-run nonce):
 *   <nonce>CASE {"id","ok","value"|"error","timeMs"}
 *   <nonce>COMPILE {"error"}
 *   <nonce>DONE {"stdout"}
 * Values are serialized here (ListNode/TreeNode → arrays); comparison happens in the parent.
 */

export const JS_HARNESS = String.raw`
const vm = require('vm');
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  const p = JSON.parse(raw);
  const out = process.stdout.write.bind(process.stdout);
  const emit = (kind, obj) => out(p.nonce + kind + ' ' + JSON.stringify(obj) + '\n');
  let logs = '';
  const logFn = (...a) => { if (logs.length < 16384) logs += a.map((x) => typeof x === 'string' ? x : JSON.stringify(x)).join(' ') + '\n'; };
  console.log = console.info = console.warn = console.error = logFn;

  class ListNode { constructor(val = 0, next = null) { this.val = val; this.next = next; } }
  class TreeNode { constructor(val = 0, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }
  globalThis.ListNode = ListNode; globalThis.TreeNode = TreeNode;

  const toList = (a) => { let h = null; for (let i = a.length - 1; i >= 0; i--) h = new ListNode(a[i], h); return h; };
  const fromList = (n) => { const r = []; let guard = 0; while (n && guard++ < 100000) { r.push(n.val); n = n.next; } return r; };
  const toTree = (a) => {
    if (!a.length || a[0] === null) return null;
    const root = new TreeNode(a[0]); const q = [root]; let i = 1, h = 0;
    while (h < q.length && i < a.length) {
      const n = q[h++];
      if (i < a.length && a[i] !== null) { n.left = new TreeNode(a[i]); q.push(n.left); } i++;
      if (i < a.length && a[i] !== null) { n.right = new TreeNode(a[i]); q.push(n.right); } i++;
    }
    return root;
  };
  const fromTree = (root) => {
    const r = []; const q = [root]; let h = 0;
    while (h < q.length) { const n = q[h++]; if (n) { r.push(n.val); q.push(n.left, n.right); } else r.push(null); }
    while (r.length && r[r.length - 1] === null) r.pop();
    return r;
  };
  const decode = (v, t) => t === 'ListNode' ? toList(v) : t === 'TreeNode' ? toTree(v) : v;
  const encode = (v, t) => t === 'ListNode' ? fromList(v) : t === 'TreeNode' ? fromTree(v) : v === undefined ? null : v;

  const where = (e) => { const m = /solution\.js:(\d+)/.exec(String(e && e.stack)); return m ? ' (line ' + m[1] + ')' : ''; };
  try {
    vm.runInThisContext(p.code, { filename: 'solution.js' });
  } catch (e) {
    emit('COMPILE', { error: String(e && e.name || 'Error') + ': ' + String(e && e.message) + where(e) });
    return;
  }
  let fn = globalThis[p.fn];
  if (typeof fn !== 'function') {
    try { const S = vm.runInThisContext('typeof Solution !== "undefined" ? Solution : undefined'); if (S) { const inst = new S(); if (typeof inst[p.fn] === 'function') fn = inst[p.fn].bind(inst); } } catch (e) {}
  }
  if (typeof fn !== 'function') { emit('COMPILE', { error: 'Function "' + p.fn + '" is not defined' }); return; }

  for (const tc of p.tests) {
    const args = tc.args.map((a, i) => decode(JSON.parse(JSON.stringify(a)), p.params[i]));
    const t0 = performance.now();
    try {
      const value = encode(fn(...args), p.returnType);
      emit('CASE', { id: tc.id, ok: true, value, timeMs: performance.now() - t0 });
    } catch (e) {
      emit('CASE', { id: tc.id, ok: false, error: String(e && e.name || 'Error') + ': ' + String(e && e.message) + where(e), timeMs: performance.now() - t0 });
    }
  }
  emit('DONE', { stdout: logs });
});
`;

export const PY_HARNESS = String.raw`
import sys, json, time, io
p = json.loads(sys.stdin.read())
_out = sys.stdout
def emit(kind, obj):
    _out.write(p['nonce'] + kind + ' ' + json.dumps(obj, default=_default) + '\n'); _out.flush()
def _default(o):
    if isinstance(o, (set, frozenset)): return sorted(o)
    return str(o)

try:
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
except Exception:
    pass
sys.setrecursionlimit(20000)

class ListNode:
    def __init__(self, val=0, next=None): self.val = val; self.next = next
class TreeNode:
    def __init__(self, val=0, left=None, right=None): self.val = val; self.left = left; self.right = right

def to_list(a):
    h = None
    for v in reversed(a): h = ListNode(v, h)
    return h
def from_list(n):
    r, g = [], 0
    while n is not None and g < 100000: r.append(n.val); n = n.next; g += 1
    return r
def to_tree(a):
    if not a or a[0] is None: return None
    root = TreeNode(a[0]); q = [root]; i = 1; h = 0
    while h < len(q) and i < len(a):
        n = q[h]; h += 1
        if i < len(a) and a[i] is not None: n.left = TreeNode(a[i]); q.append(n.left)
        i += 1
        if i < len(a) and a[i] is not None: n.right = TreeNode(a[i]); q.append(n.right)
        i += 1
    return root
def from_tree(root):
    r, q, h = [], [root], 0
    while h < len(q):
        n = q[h]; h += 1
        if n is not None: r.append(n.val); q.append(n.left); q.append(n.right)
        else: r.append(None)
    while r and r[-1] is None: r.pop()
    return r
def decode(v, t): return to_list(v) if t == 'ListNode' else to_tree(v) if t == 'TreeNode' else v
def encode(v, t):
    if t == 'ListNode': return from_list(v)
    if t == 'TreeNode': return from_tree(v)
    if isinstance(v, tuple): return list(v)
    return v

BLOCKED = ('subprocess.', 'os.system', 'os.exec', 'os.spawn', 'os.fork', 'os.posix_spawn', 'os.kill',
           'socket.', 'ctypes.', 'os.remove', 'os.rmdir', 'os.rename', 'os.unlink', 'shutil.', 'os.chmod', 'winreg.')
def audit(event, args):
    if event.startswith(BLOCKED):
        raise PermissionError('Operation not permitted in sandbox: ' + event)
    if event == 'open' and len(args) > 1 and isinstance(args[1], str) and any(c in args[1] for c in 'wax+'):
        raise PermissionError('File writes are not permitted in sandbox')

logs = io.StringIO()

def where(e):
    tb = e.__traceback__; line = None
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == 'solution.py': line = tb.tb_lineno
        tb = tb.tb_next
    return ' (line %d)' % line if line else ''

if p.get('mode') == 'sql':
    import sqlite3
    db = sqlite3.connect(':memory:')
    db.executescript(p['setup'])
    ALLOWED = {sqlite3.SQLITE_SELECT, sqlite3.SQLITE_READ, sqlite3.SQLITE_FUNCTION, getattr(sqlite3, 'SQLITE_RECURSIVE', 33)}
    db.set_authorizer(lambda action, *a: sqlite3.SQLITE_OK if action in ALLOWED else sqlite3.SQLITE_DENY)
    sys.addaudithook(audit)
    q = p['code'].strip().rstrip(';').strip()
    t0 = time.perf_counter()
    try:
        cur = db.execute(q)
        rows = [list(r) for r in cur.fetchmany(1000)]
        emit('CASE', {'id': p['tests'][0]['id'], 'ok': True, 'value': rows, 'timeMs': (time.perf_counter() - t0) * 1000})
    except Exception as e:
        emit('CASE', {'id': p['tests'][0]['id'], 'ok': False, 'error': type(e).__name__ + ': ' + str(e), 'timeMs': (time.perf_counter() - t0) * 1000})
    emit('DONE', {'stdout': ''})
    sys.exit(0)

ns = {'ListNode': ListNode, 'TreeNode': TreeNode, '__name__': 'solution'}
sys.addaudithook(audit)
sys.stdout = logs
try:
    exec(compile(p['code'], 'solution.py', 'exec'), ns)
except BaseException as e:
    sys.stdout = _out
    detail = (' (line %d)' % e.lineno) if isinstance(e, SyntaxError) and e.lineno else where(e)
    emit('COMPILE', {'error': type(e).__name__ + ': ' + str(e) + detail}); sys.exit(0)

fn = ns.get(p['fn'])
if not callable(fn) and 'Solution' in ns:
    try: fn = getattr(ns['Solution'](), p['fn'], None)
    except Exception: fn = None
if not callable(fn):
    sys.stdout = _out
    emit('COMPILE', {'error': 'Function "%s" is not defined' % p['fn']}); sys.exit(0)

for tc in p['tests']:
    args = [decode(json.loads(json.dumps(a)), p['params'][i]) for i, a in enumerate(tc['args'])]
    t0 = time.perf_counter()
    try:
        value = encode(fn(*args), p['returnType'])
        emit('CASE', {'id': tc['id'], 'ok': True, 'value': value, 'timeMs': (time.perf_counter() - t0) * 1000})
    except BaseException as e:
        emit('CASE', {'id': tc['id'], 'ok': False, 'error': type(e).__name__ + ': ' + str(e) + where(e), 'timeMs': (time.perf_counter() - t0) * 1000})
sys.stdout = _out
emit('DONE', {'stdout': logs.getvalue()[:16384]})
`;
