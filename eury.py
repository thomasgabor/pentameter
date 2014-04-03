import sys
sys.path.append('./nullmq/demos/presence/python')

import server as bridge

if __name__ == '__main__':
    def websocket_handler(websocket, environ):
        bridge.StompHandler(websocket, bridge.ZeroMQBridge()).serve()

    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000

    server = bridge.WebSocketServer(('127.0.0.1', port), websocket_handler)
    print "**  Starting (Pentameter/NullMQ)-(Pentameter/ZeroMQ) bridge from port " + str(port) + " to arbitrary ZeroMQ ports"
    server.serve_forever()