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

app.get('/', (req, res) => {
    res.json(dataArray)
})

app.post('/', (req, res) => {
    const data = req.query.data;
    dataArray.push(data)
    res.status(201).json({
        "status": 201,
        'message': 'Resource created'
    })
})

app.patch('/', (req, res) => {
    const index = req.query.index;
    const data = req.query.data;
    dataArray[index] = data
    res.status(204).json({
        "status": 204,
        'message': 'Updated'
    })
})

app.get('/article', async (req, res) => {
    const title = req.query.title;
    try {
        let response;
        try {
            response = await request(`https://en.wikipedia.org/wiki/${title}`)
        } catch (err) {
            res.status(404).send(response)
            return;
        }
        const doc_obj = new JSDOM(response);
        const doc = doc_obj.window.document.body;
        r = {}
        r['title'] = doc.querySelector('#firstHeading').innerHTML;
        r['link'] = `https://en.wikipedia.org/wiki/${r['title']
            .replace(' ', '_')}`
        dataArray.push(r['link'])
        const temp = doc.querySelectorAll('p')
        let bodyString = ''
        temp.forEach((val) => {
            bodyString += val.textContent 
        })

        const finalBodyString = bodyString.replace('\n', '')

        r['body'] = finalBodyString
        r['issues'] = false;
        res.json(r)   
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

app.get('/edit', async (req, res) => {
    try {
        const title = req.query.title;
        const response = await request(`https://en.wikipedia.org/wiki/${title}?action=edit`)
        res.send(response)
    } catch (err) {
        res.json(err)
    }

})

app.get('/compare', async (req, res) => {

    try {
        if(!req.query.to || !req.query.from) {
        res.status(400).send('required params missing')
        return
        }
        const to = req.query.to;
        const from = req.query.from;

        let response;
        try {
            response = await request(`https://en.wikipedia.org/wiki/${to}`)
            response = await request(`https://en.wikipedia.org/wiki/${from}`)
        } catch (err) {
            res.status(404).send('article not found')
            return;
        }

        const r = {}
        r['result'] = .5
        r['to'] = {'title': to, link: `https://en.wikipedia.org/wiki/${to}`}
        r['from'] = {'title': from, link: `https://en.wikipedia.org/wiki/${from}`}

        res.json(r)
    } catch (err) {
        res.status(500).send('internal error')
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