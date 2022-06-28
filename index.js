const express = require('express');
const { JSDOM } = require('jsdom');
const cors = require('cors')
const request = require('request-promise')

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors())

app.listen(PORT, (error) =>{
    if(!error)
        console.log("App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);

const dataArray = []

app.get('/history', (req, res) => {
    res.json(dataArray)
})

app.delete('/history', (req, res) => {
    const index = req.query.index;
    dataArray.splice(index, 1);
    res.status(200).json({
        "status": 200,
        'message': 'OK - Deleted'
    })
})

app.get('/article', async (req, res) => {
    const title = req.query.title;
    try {
        let formattedArticle = await getArticle(title);
        res.json(formattedArticle)   
    } catch (err) {
        res.status(500).send(err)
    }
})

app.post('/article', async (req, res) => {
    const title = req.query.title;
    try {
        let formattedArticle = await getArticle(title);
        if (formattedArticle.issues) {
            res.status(404).json(formattedArticle)
        }
        dataArray.push(formattedArticle)
        res.status(201).json({
            "status": 201,
            'message': 'Resource created'
        })  
    } catch (err) {
        res.status(500).send(err)
    }
})

app.patch('/article', async (req, res) => {
    try {
        const index = req.query.index;
        const title = req.query.title;
        const newData = await getArticle(title)
        dataArray[index] = newData
        res.status(204).json({
            "status": 204,
            'message': 'Updated'
        })
    } catch (err) {
        res.status(500).send(err)
    }
})

app.get('/subarticles', async (req, res) => {
    try {
        const title = req.query.title;
        let response;
        try {
            response = await request(`https://en.wikipedia.org/wiki/${title}`)
        } catch (err) {
            res.status(404).json(response)
            return;
        }        const parsedArticle = parseArticle(response)
        //res.json(JSON.parse(parsedArticle))
        res.json(parsedArticle)
    } catch (err) {
        res.json(err)
    }
})


function parseArticle(toParse) {
    const hrefs = new Array();
    const find = '/wiki/'
    for (let i = 0; i < toParse.length-100; i++) {
        if (find.valueOf() == toParse.substring(i, i+find.length).valueOf()){
            const toPush = getWord(toParse.substring(i+find.length));
            if (hrefs.indexOf(toPush) == -1 && isValid(toPush)) {
                hrefs.push(toPush)
            }
        }
    }
    return hrefs
}

function getWord(word) {
    let i = 0;
    for (; i < word.length; i++) {
        if (word.charAt(i) == ' ') 
            break;
    }

    const r = word.substring(0, i-1)
    return r
}

function isValid(checkString) {
    const bannedChars = ['%', ':', '<', '>', '='];

    for (let i = 0; i < bannedChars.length; i++){
        if (checkString.indexOf(bannedChars[i]) != -1) {
            return false;
        }
    }

    return true;
}

async function getArticle(title) {
    let response

    try {
        response = await request(`https://en.wikipedia.org/wiki/${title}`)
    } catch (err) {
        return {
            issues: true
        };
    }
    const doc_obj = new JSDOM(response);
    const doc = doc_obj.window.document.body;
    const result = {}
    result['title'] = doc.querySelector('#firstHeading').innerHTML;
    result['link'] = `https://en.wikipedia.org/wiki/${result['title']
        .replace(' ', '_')}`
    const temp = doc.querySelectorAll('p')
    let bodyString = ''
    temp.forEach((val) => {
        bodyString += val.textContent 
    })

    const finalBodyString = bodyString.replace('\n', '')

    result['body'] = finalBodyString
    result['issues'] = false;
    return result;
}