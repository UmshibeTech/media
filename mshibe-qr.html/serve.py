import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description="Serve the Mshibe QR code page locally.")
    parser.add_argument("--port", type=int, default=8000, help="port to serve on (default: 8000)")
    args = parser.parse_args()

    directory = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    server = ThreadingHTTPServer(("0.0.0.0", args.port), handler)
    print(f"Serving the page at http://localhost:{args.port}/qrcode.html")
    print("Press Ctrl+C to stop the server.")
    server.serve_forever()


if __name__ == "__main__":
    main()
