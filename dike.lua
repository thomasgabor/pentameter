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

local received = {}
local answered = {}
local currentindex = 0
local function time()
    return function(msgtype, author, space, parameter)
    	if string.match(space, "^pentameter") then
    		local response = {}
    		for i,item in pairs(parameter) do
    			for a,answer in pairs(answered[item["&askfor"]] or {}) do
	    			table.insert(response, answer)
				end
				if msgtype == "get" then
					answered[item["&askfor"]] = nil
				end
    		end
    		return response
    	else
    		--print("**  saved message @"..space)
	    	currentindex = currentindex + 1
    		received[currentindex] = {key=currentindex, type=msgtype, author=author, space=space, parameter=parameter}
    		return {{["&askfor"] = currentindex}}
    		--TODO: consider means to wait with sending the ACK until we actually have an answer from the frontend, i.e. Orpheus
    	end
	end
end

local context = zmq.init(1);
local socket = context:socket(zmq.ROUTER)
local socketname = arg[1] or "*:88888"
socket:bind("tcp://"..socketname)
hexameter.init(arg[2] or "localhost:99999", time, nil, nil, {socketcache=arg[3] or 10})
print("**  Starting (Pentameter/ZeroMQ)-(Hexameter/ZeroMQ) gateway from "..socketname.." to "..hexameter.me())
while true do
	local src, del, msg = multirecv(socket, 0)
	local message =  msg and json.decode(msg)
	if message then
		if message.space == "pentameter.pending" and (message.type == "qry" or message.type == "get") then
			local answers = {}
			for i,item in pairs(message.parameter) do
				if item.bother then
					hexameter.ask("get", item.bother, "net.life", {{a=42}})
				end
				table.insert(answers, {messages=received})
				if (#received > 0) and (message.type == "get") then
					print("**  "..#received.." pending messages delivered"..(message.author and " to "..message.author or ""))
					received = {}
					currentindex = 0
				end
			end
			local response = {
				type = "ack",
				author = hexameter.me(),
				space = "pentameter.pending",
				parameter = answers
			}
			multisend(socket, src, del, json.encode(response))
		elseif message.space == "pentameter.returning" and message.type == "put" then
			--print("**  attempting to save return values " .. json.encode(message.parameter))
			local answers = {}
			for i,item in pairs(message.parameter or {}) do
				for a,answer in pairs(item.messages or {}) do
					print("**  answered message #"..a)
					answered[a] = answer
				end
				if item.key then
					print("**  answered message #"..item.key)
					answered[item.key] = item.value;
				end
				table.insert(answers, item)
			end
			local response = {
				type = "ack",
				author = hexameter.me(),
				space = "pentameter.returning",
				parameter = answers
			}
			multisend(socket, src, del, json.encode(response))
		elseif (message.space == "pentameter.me" or message.space == "pentameter.name") and (message.type == "qry" or message.type == "get") then
			local answers = {}
			for i,item in pairs(message.parameter or {}) do
				table.insert(answers, {name=hexameter.me()})
			end
			local response = {
				type = "ack",
				author = message.recipient,
				space = message.space,
				parameter = answers
			}
			multisend(socket, src, del, json.encode(response))
		else
			print("**  Referring to "..message.recipient.." for "..message.type.."@"..message.space)
			local answers = hexameter.ask(message.type, message.recipient, message.space, message.parameter)
			print("**  Returning with result")
			local response = {
				type = "ack",
				author = message.recipient,
				space = message.space,
				parameter = answers
			}
			multisend(socket, src, del, json.encode(response))
		end
	end
end
