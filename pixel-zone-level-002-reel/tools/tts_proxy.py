"""Runs $LIB/core/tts/tts_zh.py with edge-tts routed through the HTTPS proxy (when HTTPS_PROXY is set).
Usage: python tools/tts_proxy.py <lines.json> <out_dir>"""
import os, sys, runpy, functools
import edge_tts
px = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
if px:
    _C = edge_tts.Communicate
    class Communicate(_C):
        def __init__(self, *a, **k):
            k.setdefault('proxy', px); super().__init__(*a, **k)
    edge_tts.Communicate = Communicate
lib = os.environ['LIB']
sys.argv = [os.path.join(lib, 'core/tts/tts_zh.py')] + sys.argv[1:]
runpy.run_path(sys.argv[0], run_name='__main__')
