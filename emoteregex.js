function emoteRegex(regex,flags)
{
	this.flags = flags||"";
	// emotes get turned into unicode PUA symbols, message length limits give us a loose upper bound of ~250 different emotes per message
	// so we reserve E400-E4FF (256 slots)
	this.regex = regex; 
	this.toString = function(){return "/"+this.regex+"/"+this.flags};
	this.test = function(data)
	{
		var t = emoteRegex.utils.translateRegex(this.regex,data);
		var p = emoteRegex.parseMessage(data)[4].substr(1);
		return new RegExp(t,this.flags).test(p);
	};
	this.exec = function(data)
	{
		return new RegExp(emoteRegex.utils.translateRegex(this.regex,data),this.flags).exec(emoteRegex.parseMessage(data)[4].substr(1));
	};
}

emoteRegex.parseMessage = function(msg)
{
	if(typeof msg != "string")return msg;
	return emoteRegex.utils.splitrec(msg.substr(1),[{"sep":" ","max":4},{"sep":";","dictionary":1},"="]);
}

emoteRegex.utils = function(){
}

emoteRegex.utils.splitrec = function(data,seperators,options)
{
	if(seperators == "")return data;
	else if(data == "" && options!=undefined && options["ignoreNonexistant"]==1)
	{
		return null;
	}
	var sep = seperators[0];
	if(typeof sep==="string")sep = {"sep":sep}
	sep["dictionary"] = sep["dictionary"]||false;
	var res=null;
	var sp = emoteRegex.utils.cssplit(data,sep["sep"],sep["max"],options!=undefined && options["ignoreNonexistant"]==1);
	if(sep["dictionary"])
	{
		res = {}
		for(var i=0;i<sp.length;i++)
		{
			var recres = emoteRegex.utils.splitrec(sp[i],seperators.slice(1),options);
			if(recres === null)continue;
			if(recres.length==2)res[recres[0]]=recres[1];
			else if(recres.length>2)res[recres[0]]=recres.slice(1);
			else res=recres[0];
		}
	}
	else
	{
		res = [];
		for(var i=0;i<sp.length;i++)
		{
			var recres = emoteRegex.utils.splitrec(sp[i],seperators.slice(1),options);
			if(recres === null)continue;
			res.push(recres);
		}
	}
	return res;
}

emoteRegex.utils.cssplit = function(data,sep,limit,removeEmptyEntries)
{
	var res = [];
	var tmp = "";
	for(var i=0;i<data.length;i++)
	{
		if(data[i]===sep&&!(res.length>=limit))
		{
			if(tmp||!removeEmptyEntries)
			{
				res.push(tmp);
				tmp = "";
			}
		}
		else
		{
			tmp += data[i];
		}
	}
	if(tmp||!removeEmptyEntries)
	{
		res.push(tmp);
	}
	return res;
}

emoteRegex.utils.translateRegex = function(regex,message)
{
	tags = emoteRegex.parseMessage(message);
	emotes = emoteRegex.utils.splitrec(tags[0]["emotes"],[{"sep":"/","dictionary":1},":",",","-"]);
	var chatline = tags[4].substr(1);
	//console.log(emotes);
	var allemotes = "";
	var firstemote = true;
	for(k in emotes)
	{
		if(!firstemote)allemotes += "|";
		firstemote = false;
		//console.log(parseInt(emotes[k][0][0])+" to "+(parseInt(emotes[k][0][1])+1)+": "+chatline.substring(emotes[k][0][0],emotes[k][0][1]+1));
		allemotes += chatline.substring(parseInt(emotes[k][0][0]),parseInt(emotes[k][0][1])+1).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}
	if(allemotes == "") r = regex.replace("\\{emote}","(?=a)b");
	else r = regex.replace("\\{emote}","(?:"+allemotes+")");
	//console.log(r);
	return r;
}
