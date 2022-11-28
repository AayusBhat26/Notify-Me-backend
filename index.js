const PORT = 3002;
// dotenv, express, mongoose cors, 
const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// app configuration
const app = express(); // creating an express object.
app.use(express.json()); // allowing our app to deal with json data.
app.use(express.urlencoded()); 
app.use(cors()); // for cross domain requests


// database configuration.
mongoose.connect(
  "mongodb+srv://aayushbhat26:Aayushbhat26!@cluster0.seuwwvy.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("DB connected successfully");
  }
);

// creating a schema for reminder
const reminderSchema = new mongoose.Schema({
      phoneNumber: String,
      reminderMessage: String, 
      remindeTime: String,
      isReminded: Boolean
})

// creating a model for reminder.
const Reminder = new mongoose.model('reminder', reminderSchema);
// whatsapp reminder.


setInterval(()=>{
      Reminder.find({

      },
      (err, reminderList)=>{
            if(err){
                  console.log(err)
            }
            else{
                 if(reminderList){
                  reminderList.forEach(reminder=>{
                        if(!reminder.isReminded){
                              const now = new Date();
                              if((new Date(reminder.remindeTime) - now) < 0){
                                    Reminder.findByIdAndUpdate(reminder._id, {
                                          isReminded: true
                                    }, (err, remindObj)=>{
                                           if(err){
                                                console.log(err);
                                           }
                                           else{
                                             // send message
                                             const accountSid = process.env.ACCOUNT_SID;
                                             const authToken = process.env.AUTH_TOKEN;
                                             const client = require("twilio")(accountSid, authToken);
                                             client.messages
                                               .create({
                                                 body: `${reminder.reminderMessage}`,
                                                 from: "whatsapp:+14155238886",
                                                 to: `whatsapp:+91${reminder.phoneNumber}`,
                                               })
                                               .then((message) => console.log(message.sid))
                                               .done();
                                           }
                                    }                                    
                                    )
                              }
                        }
                  })
                 } 
            }
      }
      )
}, 60000)



// specifying the routes. (API ROUTES)

// 0. demo route.
app.get('/demo', (req, res)=>{
      res.send('Demo route, backend configured successfully');
})
// 1. fetch all the reminders.
app.get('/getAllReminders', (req, res)=>{
      Reminder.find({

      }, (err, reminderList)=>{
            if(err){
                  console.log(err);
            }
            else{
                  if(reminderList){
                        res.send(reminderList)
                  }
            }
      })
})    

// 2. create a new reminder.
app.post('/addNewReminder', (req, res)=>{
      const {reminderMessage, remindeTime, phoneNumber} = req.body;
      const reminder = new Reminder({
            phoneNumber,
            reminderMessage, 
            remindeTime, 
            isReminded: false
      });
      reminder.save(err=>{
            if(err){
                  console.log(err);
            }
            else{
                   Reminder.find({}, (err, reminderList) => {
                     if (err) {
                       console.log(err);
                     } else {
                       if (reminderList) {
                         res.send(reminderList);
                       }
                     }
                   });
            }
      });
})

// 3. delete a reminder.
app.post('/deleteReminder', (req, res)=>{
      Reminder.deleteOne({
            _id: req.body.id
      }, ()=>{
             Reminder.find({}, (err, reminderList) => {
               if (err) {
                 console.log(err);
               } else {
                 if (reminderList) {
                   res.send(reminderList);
                 }
               }
             });
      })
})



// port 
app.listen(PORT, ()=>{
      console.log(`Backend listening on port ${PORT}`);
})