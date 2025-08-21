import express, { json } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());


const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

mongoClient.connect()
  .then(() => {

    console.log("Banco conectado");
    db = mongoClient.db()})
  .catch((err) => console.log(err.message));
 

function validateUser(user){
     const userSchema = joi.object({
        username : joi.string().required(),
        tweet: joi.string().required()
    });
    const validate = userSchema.validate(user , { abortEarly: false });
    if (validate.error){
        const err = validate.error.details.map(datail => datail.message);
        return err;
    }
    return false;
};

async function userExists(tweeter){
    try{
        const userExistente = await db.collection("users").findOne({
        username : tweeter.username
    })
        if (!userExistente){
            return 401;
        }
        return false;
    }catch(err){
        return 500;
    }
    
};

app.post("/sign-up", async (req, res) =>{
    const user = req.body;

    const userSchema = joi.object({
        username : joi.string().required(),
        avatar: joi.string().required()
    });
    const validate = userSchema.validate(user , { abortEarly: false });
    if (validate.error){
        const err = validate.error.details.map(datail => datail.message);
        return res.status(422).send(err);
    }
   
    try{
        await db.collection('users').insertOne(user)
        return res.sendStatus(201)
    } catch (error){
        console.error(error.message);
        return res.sendStatus(500)
    }
    
    
});

app.post("/tweets", async (req, res) =>{
    const tweeter = req.body;
    const userExistente = await db.collection("users").findOne({
        username : tweeter.username
    })
    if (!userExistente){
        return res.sendStatus(401);
    }
   
    const validate = validateUser(tweeter)
    if (validate){
        return res.status(422).send(validate);
    }

    try{
        await db.collection("tweets").insertOne(tweeter)
        return res.sendStatus(201)
    }catch(err){
        return res.sendStatus(500)
    }
});


const port = process.env.PORT;
app.listen(port, ()=>{
    console.log(`Servidor rodando na porta ${port}`)
})
 
