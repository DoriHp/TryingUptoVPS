var express = require('express')
var Student = require('../models/student.model.js')
var Announce = require('../models/announce.model.js')
var Room = require('../models/room.model.js')
const fs = require('fs')

module.exports.index = async (req, res)=>{
	var page = parseInt(req.query.page)
	var result = await Student.find().lean()
	var start
	if(page == 0){
		start = 0
	}else{
		start = page * 16 - 1
	}
	var end =  start + 16
	var arrValue = result.slice(start, end)
	var check = ''
	for(let i of arrValue){
		i.birthday = i.birthday.replace("/", "-")
		i.birthday = i.birthday.replace("/", "-")
		i.city = i.city.replace("/", "-")
		check += `${i._id} / ${i.name} / ${i.gender} / ${i.class} / ${i.phone} / ${i.email} / ${i.birthday} / ${i.city} / ${i.identify} / ${i.room} / ${i.times}/`
	}
	var total = Math.ceil(result.length / 16)
	check += total
	res.status(200).send(check)
}

module.exports.sendImage = async (req, res)=>{
	var name = req.query.name
	name = name.replace('+', ' ')
	name = name.trim()
	var link = await Student.findOne({ name : name }).lean()
	if(link){
		res.sendFile(__basedir + '/public/upload/' + link.imageName)
	}else{
		res.status(404).end()
	}
}

module.exports.search = async (req, res)=>{
	let result = []
	if(req.query.name){
		var name = req.query.name
		console.log(name)
		result = await Student.find({ name: name }).lean()
	}
	if(req.query.class){
		var classNo = req.query.class
		result = await Student.find({ class: classNo }).lean()
	}
	if(req.query.id){
		var id = req.query.id
		console.log(id)
		var obj = await Student.findById(id).lean()
		if(obj != null){ result[0] = obj }
	}
	if(Array.isArray(result) && result.length){ 
		let check = ''
		for(let i of result){
			i.birthday = i.birthday.replace("/", "-")
			i.birthday = i.birthday.replace("/", "-")
			i.city = i.city.replace("/", "-")
			check += `${i._id}/${i.name}/${i.gender}/${i.class}/${i.phone}/${i.email}/${i.birthday}/${i.city}/${i.identify}/${i.room}/${i.times}/`
		}
	check += result.length
	res.status(200).send(check)
	}else{
		res.status(404).end();
	}
}

module.exports.createNew = (req, res)=>{
	req.body.avatar = req.file.filename
	console.log(req.body)
	Student.insertMany({
		name : req.body.name,
		gender : req.body.gender,
		phone : req.body.phone,
		email : req.body.email,
		birthday : req.body.birthday,
		city : req.body.city,
		class : req.body.class,
		identify : req.body.identify,
		room : req.body.room,
		times : req.body.times,
		imageName : req.body.avatar
	}, function(err, result){
			if(err){
				res.status(500).end()
				return;
			}
			else{
				res.status(200).end()
			}
		});
};

module.exports.execPut = (req, res)=>{
	var id = req.params.id
	id = id.replace('+', '')
	Student.findByIdAndUpdate(id,  
		{ name: req.body.name ,
		 gender: req.body.gender,
		 phone: req.body.phone ,
		 email: req.body.email ,
		 city: req.body.city ,
		 identify: req.body.identify ,
		 class: req.body.class ,
		 room: req.body.room ,
		 times: req.body.times ,
		 birthday: req.body.birthday}
		, 
		{upsert: true}, 
		err=>{
			if(!err){
				res.status(200).end()
			}else{
				res.status(500).end()
			}
		})
}

module.exports.execDel = async (req, res)=>{
	var id = req.params.id
	id = id.replace('+', '')
	var search = await Student.findById(id)
	if(!search){
		console.log(search)
		res.status(404).end()
	}else{
		Student.findByIdAndRemove({ _id: id}, async err=>{
			if(!err){
				await fs.unlink(__basedir + '/public/upload/' + search.imageName)
				res.status(200).end()
			}
			else{
				res.status(500).end()
			}
		})
	}
}

module.exports.sendAnnounce = async (req, res)=>{
	var result = await Announce.find().lean()
	var num = result.length - 5
	var arr = result.slice(num)
	if(Array.isArray(result) && result.length){
		let check = ''
		for(let i of arr){
			check += `${i._id} / ${i.title} /`
		}
		res.status(200).send(check)
	}else{
		res.status(404).end();
	}
}

module.exports.sendContent = async (req, res)=>{
	var id = req.params.id
	var result = await Announce.findById(id).lean()
	if(result){
		res.status(200).sendFile(__basedir + '/public/announce/' + result.content)
	}else{
		res.status(404).end()
	}
}

module.exports.roomStatus = async (req, res)=>{
	var arr = await Room.find().lean()
	var str = ''
	for(let i of arr){
		str += i.members
	}
	res.status(200).send(str)
}

module.exports.roomRegister1 = (req, res, next)=>{
	var room = req.params.room
	Room.findOneAndUpdate(
		{ roomID: room },
		{ $inc: { members: 1 } },
		{ upsert: false }, 
		err=>{
			if(err){
				console.log(err)
				res.status(500).end()
				return
			}else{
				next()
			}
		})
}
module.exports.roomRegister2 = async (req, res, next)=>{
	var id = req.body.id
	var obj = await Student.findById(id).lean()
	Room.findOneAndUpdate(
		{ roomID: obj.room },
		{ $inc: { members: -1 }},
		{ upsert: false }, 
		err =>{
			if(err){
				console.log(err)
				res.status(500).end()
				return
			}else{
				next()
			}
		}
	)
}

module.exports.roomRegister3 = (req, res)=>{
	var room = req.params.room
	var id = req.body.id
	Student.findByIdAndUpdate(id,
		{ $set: { room: room } },
		{ upsert: false }, 
		err=>{
			if(err){
				res.status(500).end()
				return
			}else{
				res.status(200).end()
			}
		})
}
