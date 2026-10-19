# Mshibe Wedding Film QR page

## Run locally

Open a terminal in this folder and run:

```sh
python3 serve.py
```

Then open <http://localhost:8000/qrcode.html>. To use a different port:

```sh
python3 serve.py --port 5501
```

Keep the server running while using the page. The QR code points to the page's
current address. To test it from a phone on the same Wi-Fi network, open the
page on your computer using its local network IP address and scan the QR code
with the phone. A `localhost` QR code only works on the computer itself.

The QR-code library is loaded from a CDN, so an internet connection is needed
for QR generation. For a public, shareable QR code, publish the page to a web
host and use its HTTPS address.
