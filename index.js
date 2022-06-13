const express = require('express');
const { JSDOM } = require('jsdom');

const request = require('request-promise')


const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.listen(PORT, (error) =>{
    if(!error)
        console.log("App is listening on port "+ PORT)
    else 
        console.log("Error occurred, server can't start", error);
    }
);

app.get('/', (req, res) => {
    res.send('<h1>wikipedia scraper<\h1>')
})

app.get('/test', (req, res) => {
    res.send('<h1> tinky winky </h1>')

})

app.get('/view', async (req, res) => {
    try {
        const title = req.query.title;
        const response = await request(`https://en.wikipedia.org/wiki/${title}`)
        res.send(response)
    } catch (err) {
        res.send(err)
    }
})

app.get('/article', async (req, res) => {
    const title = req.query.title;
    try {
        const response = await request(`https://en.wikipedia.org/wiki/${title}`)
        const doc_obj = new JSDOM(response);
        const doc = doc_obj.window.document.body;
        r = {}
        r['title'] = doc.querySelector('#firstHeading').innerHTML;
        r['link'] = `https://en.wikipedia.org/wiki/${r['title']
            .replace(' ', '_')}`

        const temp = doc.querySelectorAll('p')
        let bodyString = ''
        temp.forEach((val) => {
            bodyString += val.textContent 
        })

        const finalBodyString = bodyString.replace('\n', '')
        console.log(bodyString)

        r['body'] = finalBodyString
        res.json(r)   

    } catch (err) {
        res.send(err)
    }
})

app.get('/subarticles', async (req, res) => {
    try {
        const title = req.query.title;
        const response = await request(`https://en.wikipedia.org/wiki/${title}`)
        const parsedArticle = parseArticle(response)
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