import sys
sys.path.append('./nullmq/demos/presence/python')

import server as bridge

if __name__ == '__main__':
    def websocket_handler(websocket, environ):
        bridge.StompHandler(websocket, bridge.ZeroMQBridge()).serve()

    try:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    except ValueError:
        print "Usage:  python eury.py <port number>"
        print "        If <port number> is left out, it defaults to 9000."
        sys.exit(0)

    server = bridge.WebSocketServer(('127.0.0.1', port), websocket_handler)
    print "**  Starting (Pentameter/NullMQ)-(Pentameter/ZeroMQ) bridge from port " + str(port) + " to arbitrary ZeroMQ ports"
    server.serve_forever()