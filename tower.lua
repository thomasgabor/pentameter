package.path = "./hexameter/?.lua;"..package.path

local hexameter = require "hexameter"
local zmq = require "zmq"
local json = require "dkjson"

local function multisend(socket, ...)  --send a message consisting of mutliple frames
	for i,frame in ipairs(arg) do
		if i == #arg then
			return socket:send(frame)
		else
			socket:send(frame, zmq.SNDMORE)
		end
	end
end

local function multirecv(socket, recvoptions)  --receive all frames of a message
	local frames = {}
	frames[#frames+1] = socket:recv(recvoptions)
	while socket:getopt(zmq.RCVMORE) == 1 do
		frames[#frames+1] = socket:recv()
	end
	return unpack(frames)
end

local context = zmq.init(1);
local socket = context:socket(zmq.ROUTER)
local socketname = "*:88888"
socket:bind("tcp://"..socketname)
hexameter.init("localhost:99999")
print("**  Starting (Pentameter/ZeroMQ)-(Hexameter/ZeroMQ) gateway from "..socketname.." to "..hexameter.me())
while true do
	local src, del, msg = multirecv(socket, 0)
	local message =  msg and json.decode(msg)
	if message then
	print("**  Referring to "..message.recipient.." for "..message.type.."@"..message.space)
	local response = hexameter.ask(message.type, message.recipient, message.space, message.parameter)
	print("**  Returning with result")
	multisend(socket, src, del, json.encode({type = "ack", author = message.recipient, space = message.space, parameter = response}))
end
end