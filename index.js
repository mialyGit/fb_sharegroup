let express =  require('express')
let path = require('path')
let chalk = require('chalk')
let fs = require('fs')
const os = require('os')
require('dotenv').config({path: path.join(process.cwd(), '.env')})

let app  =  express() 
// set the view engine to ejs
app.set('view engine', 'ejs');

const host = {
    protocol : process.env.PROTOCOL || 'http',
    hostname : process.env.HOST || 'localhost',
    port : process.env.PORT || 1000
}

// body parser configuration
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin","*")
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-with, Content-Type, Accept")
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Credentials", true);
    next()
})

//routes
app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'public/index-oncle-bot.ejs'));
})

app.get('/sheets',(req,res)=>{
    const data = {
        range : process.env.RANGE || 'Feuille 1',
        api_key : process.env.API_KEY || 'AIzaSyDhujVBMuGlszpD6puGPbRI7_S-m5Mqv2k'
    }
    res.json(data)
})

// require('./scripts/controller')(app, path)

app.listen(host.port, async()=>{

    const puppeteer = require('puppeteer');
    const chromePaths = require('chrome-paths');
    const { faker }  = require('@faker-js/faker/locale/fr');
    const url_local = `${ host.protocol }://${ host.hostname }:${ host.port }`;

    (async () => {

       let DEFAULT_TIMEOUT =  parseInt(process.env.DEFAULT_TIMEOUT) || 1000

       //  const uopts = await checkUserData()

       let miniature_wait = DEFAULT_TIMEOUT + 2000
       
       const browserSetup = {
            headless : false,
            executablePath: chromePaths.chrome,
            defaultViewport: null,
            args: [
                "--start-maximized",
                "--user-data-dir="
            ],
            ignoreHTTPSErrors: true,
            ignoreDefaultArgs: ["--enable-automation"]
        }

        try {
            browser = await puppeteer.launch(browserSetup);
        } catch (error) {
            console.log(chalk.red(error.message));
            console.log("Je n'arrive pas à me lancer. Vérifie bien si : \n - une copie de moi est déjà en cours de lancement \n - le navigateur Chrome est correctement installé");
            return
        }

        const init_page = await browser.newPage();

        try {
            await init_page.goto(url_local, { waitUntil: 'networkidle0' });
        } catch (error) {
            // console.log(chalk.red(error.message));
            console.log("Je n'arrive pas à me lancer");
            return (await browser.close())
        }

        await windowSet(init_page, 'default_timeout', DEFAULT_TIMEOUT)

        // var htmls = await init_page.evaluate( ()=> JSON.parse(window.localStorage.getItem('dt')))

        // if(htmls == null){
            htmls = await getGroupesList()
            if((await checkedValidObj(htmls)))
                await init_page.evaluate( (d)=> window.sessionStorage.setItem('dt', JSON.stringify(d)), htmls)

        // }

        await init_page.evaluate((dt)=> {
            show_table2(dt)
        }, htmls)

        console.log(chalk.yellow("\n ---------------------- Bot facebook lancé avec succès ---------------------- "))
        console.log(" ------------ ( Veuillez completez les champs depuis le navigateur ) ------------ \n");


        let submitted = true , quitted = false
        let data = {}

        do {

            while(!quitted) {

                try {
                    await init_page.waitForFunction(() => {
                        const submit = document.getElementById('launch').value;
                        return submit == "1"
                    }, {timeout : 0, polling : 2000} )
                    quitted = true
                } catch (error) {
                    if(error.message.includes('Session closed')) 
                        return console.log('Vous avez quitté la page!!! Fin du programme');
                }

            }

            data = await init_page.evaluate(()=>{

                let inputs = {} , group_to_load = 120

                inputs.valid = true
                inputs.lang = window.document.getElementById('lang').value
                url = window.document.querySelectorAll("input[name='url']")[0];        
                url_alt = window.document.querySelectorAll("input[name='url_alt']")[0];
                contents = window.document.querySelectorAll(".ap");        
                silent_mode = window.document.querySelectorAll("input[name='silent']")[0];

                if(silent_mode.checked) inputs.silent_mode = 1;
                else inputs.silent_mode = 0;

                if(url.value!="" && contents[0].value!="" && url_alt.value!="") {                    
                    inputs.url2 = getAllUrl(url.value);                                    
                    inputs.url_alt2 = getAllUrl(url_alt.value);
                    inputs.email_fb =  window.document.querySelectorAll("input[name='email_fb']")[0].value; 
                    inputs.password_fb =  window.document.querySelectorAll("input[name='password_fb']")[0].value;          
                    hashtag = window.document.querySelectorAll("input[name='hashtag']")[0].value;             
                    groups = window.document.querySelectorAll(".row_data a");
                    inputs.every = parseInt(window.document.querySelectorAll("input[name='every']")[0].value);
                    inputs.between = parseInt(window.document.querySelectorAll("input[name='between']")[0].value);
                    inputs.waitbefore = parseInt(window.document.querySelectorAll("input[name='waitbefore']")[0].value);

                    inputs.groups_id = [];

                    for(i in groups){ 
                        if ( !isNaN(i) && typeof(groups[i].href) != "undefined" ) {
                            inputs.groups_id.push(
                                { url : groups[i].href , name : groups[i].innerText }
                            );
                        }
                    } 
        
                    if ( (inputs.url2.length * inputs.groups_id.length > 15) && !confirm('Trop de liens ('+inputs.url2.length * inputs.groups_id.length+') à publier pour un seul compte. \nVeuillez en supprimer des liens ou des groupes.\n\nArrêter l\'opération : Annuler \t\tContinuer malgré tout : OK') ) {
                        inputs.valid = false
                    }
                    else {
                        inputs.hashtags = shuffle(hashtag.split(' '));
                        contents = contents[0].value.split('/');
                        inputs.contents = shuffle(contents);
                    }                            
                }
                else {
                    if (url.value == "") url.classList.add("is-invalid");
                    if (contents[0].value == "") contents[0].classList.add("is-invalid");;
                    if (url_alt.value == "") url_alt.classList.add("is-invalid");;

                    inputs.valid = false
                }

                return inputs
            })

            submitted = data.valid

            await init_page.evaluate(()=> {
            window.document.getElementById('launch').value = "0"} )
            
        } while(!submitted);

        // console.log(data)
       // console.log(chalk.blue("\nLancement du scraping ... \n"))

        var page = await browser.newPage()
        var stopped = false, count = 0
        await page.setBypassCSP(true)

        profil = 'Profil'
        aria_label = 'Exprimez-vous'
        btn = 'Publier'

        if(data.lang == 'en'){
            profil = 'Profile'
            aria_label = 'Write something...'
            btn = 'Post'
        }

        await page.setDefaultTimeout(0)

        for (let j = 0; j < data.url2.length && !stopped; j++) {

            if(j==0) console.log(chalk.yellow('1ère publication lancée -------------\n'));
            else console.log(chalk.yellow(i+'ème publication lancée -------------\n'));

            for (let i = 0; i < data.groups_id.length && !stopped; i++) {
                const group_url = data.groups_id[i].url;
                const group_name = data.groups_id[i].name
                count ++ 

                try {
                    await page.goto(group_url + '/buy_sell_discussion', { waitUntil: 'networkidle2' });
                } catch (error) {
                    // console.log(chalk.red(error.message))
                    await page.close()
                    await init_page.evaluate(()=> {
                        window.document.body.classList.remove("loading");
                        swal("Je n'arrive pas à me connecter à facebook","Veuillez relancer le bot","error")
                    })
                    console.log("Je n'arrive pas à me connecter à facebook"); return;
                }

                await setModalAlert(page,i+1,j+1,data.groups_id.length,data.url2.length)

                await page.waitForTimeout(DEFAULT_TIMEOUT)

                await page.evaluate((prfl)=> { 
                    const link = document.querySelectorAll('a[aria-label="'+prfl+'"]')[0]
                    const write_something_btn = link.parentNode.parentNode.nextSibling
                    write_something_btn.click()
                }, profil )

                await pause()

                await page.waitForSelector('div [role="textbox"][aria-describedby]')
                await page.waitForTimeout(DEFAULT_TIMEOUT)
                const text = await page.$('div [role="textbox"][aria-describedby]')
                await text.focus()
                await page.keyboard.type(data.url2[j] + ' ')
                await page.waitForTimeout(miniature_wait)
                // await pause()
                await setWidth(0)
                await text.focus()
                await text.click({ clickCount: 3 })
                await page.waitForTimeout(DEFAULT_TIMEOUT)
                await setWidth(1)
                // await text.focus()

                if(data.contents.length > i)
                    await page.keyboard.type(data.contents[i] + ' ')
                else
                    await page.keyboard.type(data.contents[0] + ' ')

                await page.keyboard.press('Enter')
                await pause()

                if(data.hashtags.length > i)
                    await page.keyboard.type(data.hashtags[i] + ' ')
                else
                    await page.keyboard.type(data.hashtags[0] + ' ')

                await page.waitForTimeout(DEFAULT_TIMEOUT)
                await pause()     
                await page.$eval('div [role="button"][aria-label="'+btn+'"]', btn => btn.click());

                console.log('--> Publiée avec succès sur le groupe ' + group_name);

                if((count % data.every) == 0){
                    await attendre(data.between)
                } else {
                    await attendre(data.waitbefore)
                }
                
                await page.waitForTimeout(DEFAULT_TIMEOUT)
                await pause()

                // if(await stop()) stopped = true

                /* await reaction(group_url, true)

                await page.waitForTimeout(10000)

                await commenter(group_url)

                await page.waitForTimeout(10000)*/
            }   
                    
        }

        await page.close()

        await init_page.evaluate((d)=> {
            window.document.body.classList.remove("loading") ;
            let ft = "votre publication", fg= "un groupe"
            if(d.url2.length > 1 ) ft = "vos " + d.url2.length +" publications"
            if(d.groups_id.length > 1) fg = d.groups_id.length+" groupes"
            swal("Publication terminé","J'ai terminé "+ft+" dans " + fg,"success")
        }, data)

        console.log(chalk.green("\n ---------------------- Publication terminée ---------------------- "))
        // await browser.close()

        async function login( pg , username, password)
        {
            await pg.waitForSelector('input[name="email"]')
            await pg.evaluate( (input) => document.querySelector(input).value = "", 'input[name="email"]')
            await pg.waitForTimeout(DEFAULT_TIMEOUT)
            await pg.keyboard.type(username)
            await pg.waitForTimeout(DEFAULT_TIMEOUT)
            await pg.waitForSelector('input[type="password"]')
            await pg.evaluate( (input) => document.querySelector(input).value = "", 'input[type="password"]')
            await pg.waitForTimeout(DEFAULT_TIMEOUT)
            await pg.keyboard.type(password)
            await pg.waitForTimeout(DEFAULT_TIMEOUT)
            await pg.$eval('input[name="login"]', btn => btn.click());

            try {
                await pg.waitForResponse(response => response.url().startsWith("https://mbasic.facebook.com/settings/notifications"),{timeout:30000});
            } catch (error) {
                await pg.close()
                await init_page.evaluate(()=> {
                    swal("Authentification échoué","Veuillez vérifier votre login ou mot de passe","error")
                })
            }
        }

        async function getGroupesList()
        {
            let arrs = {}
            const g_page = await browser.newPage();
            try {
                await g_page.goto('https://mbasic.facebook.com/settings/notifications/groups', { waitUntil: 'networkidle0' });
            } catch (error) {
                console.log(chalk.red(error.message)); 
                await g_page.close()
                return { 
                    title : 'Je n\'arrive pas à me connecter à facebook', 
                    message : 'Veuillez relancer le bot',
                    type : 'error' 
                }
            }
            await g_page.waitForTimeout(DEFAULT_TIMEOUT)
            await waiting(g_page)

            try {
                
            arrs = await g_page.evaluate(() => {
                full_data = {
                    lang : document.documentElement.lang,
                    username : window.document.querySelectorAll("#search_div")[0].nextElementSibling.innerHTML.match(/\(([^)]+)\)/)[1],
                    grps : []
                }
                groups = window.document.querySelectorAll("h3 a")

                const gup = ( name, url )=> {
                    if (!url) url = location.href
                    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
                    var regexS = "[\\?&]"+name+"=([^&#]*)";
                    var regex = new RegExp( regexS );
                    var results = regex.exec( url );
                    return results == null ? null : results[1];
                }

                for(i in groups){ 
                    if ( !isNaN(i) && typeof(groups[i].href) != "undefined" ) {
                        const id = gup('group_id', groups[i].href)
                        full_data.grps.push(
                            { 
                                id,
                                url : 'https://web.facebook.com/groups/'+id,
                                icon : groups[i].parentNode.parentNode.previousSibling.querySelector('img').src,
                                name : groups[i].innerText
                            }
                        );
                    }
                }
                return full_data
            })

            } catch (error) {
                arrs = { 
                    title : 'Authentification requis', 
                    message : 'Veuillez d\'abord connecter manuellement sur facebook puis relancer le bot',
                    type : 'warning' 
                }
            }

            await g_page.close()
            return arrs
        }

        function checkUserData(){
            let userinfo = os.userInfo()
            let profil = process.env.PROFILE || ""
            let sys = { opsys : process.platform, username : userinfo.username, datadir : userinfo.homedir, chrome_path : './profile'};
            if (sys.opsys == "darwin") {
                profil = profil ? "/" + profil : ""
                sys.chrome_path = sys.datadir +"/Library/Application Support/Google/Chrome"+profil
            } else if (sys.opsys == "win32" || sys.opsys == "win64") {
                profil = profil ? "\\" + profil : ""
                sys.chrome_path = sys.datadir + "\\AppData\\Local\\Google\\Chrome\\User Data"+profil;
            } else if (sys.opsys == "linux") {
                profil = profil ? "/" + profil : ""
                sys.chrome_path = sys.datadir + "/.config/google-chrome"+profil;
            }

            return sys
        }

        function checkedValidObj(obj){
            return (obj["username"] !== undefined && obj["lang"] !== undefined && obj["grps"] !== undefined)
        }

        async function waiting(pg){
            await pg.waitForFunction(() => {
                return document.readyState === 'complete'
            },{ timeout: 0 })
        }

        async function base64_encode(file) {
            let typ = file.split('.')[1]
            typ = typ ? typ.toLowerCase() : 'png'
            return 'data:image/'+typ+';base64,' + fs.readFileSync('./'+file).toString('base64');
        }

        function pad(s) { return (s < 10) ? '0' + s : s; }

        function sectotime(n) {
            jj = (Math.floor(n / 86400) > 0) ? pad(Math.floor(n / 86400)) + ' jour ' : '';
            n %= 86400;
            hh = (Math.floor(n / 3600) > 0) ? pad(Math.floor(n / 3600)) + 'h ' : '';
            n %= 3600;
            mm = (Math.floor(n / 60) > 0) ? pad(Math.floor(n / 60)) + 'mn ' : '';
            ss = (Math.floor(n % 60) > 0) ? pad(Math.floor(n % 60)) + 's ' : '';
            return (jj + hh + mm + ss).trim() ;
        }

        async function setWidth(index){
            await page.evaluate((ind)=>{
                window.document.getElementById('myModal').style.width = ind ? "100%" : "" 
             }, index)
        }

        async function delete_text(inputValue) {
            for (let i = 0; i < inputValue.length; i++) {
                await page.keyboard.press('Backspace');
                await page.waitForTimeout(200)
            }
        }

        function windowSet (pg, name, value){
            pg.evaluateOnNewDocument(`
                Object.defineProperty(window, '${name}', {
                    get() {
                        return '${value}'
                    }
                })
            `)
        }

        function randomInt(min, max) { // min and max included 
            return Math.floor(Math.random() * (max - min + 1) + min)
        }

        async function commenter(group) {

            let articles = [], i = 2
            group = await group.replace('web','mbasic')

            do {
                try {
                    await page.goto(group, { waitUntil: 'networkidle2' });
                } catch (error) {
                    console.log("Je n'arrive pas à me connecter à facebook"); return;
                }
                
                try {
                    await page.waitForFunction(() => document.querySelectorAll('section > article > footer').length);
                    await page.waitForTimeout(DEFAULT_TIMEOUT)
                    articles = await page.$$('section > article > footer')
                } catch (error) {
                    console.log(error)
                }

                if (articles.length > 0) {
                    await scrollDownElement(articles[i])
                    await Promise.all([
                        articles[i].$eval('div:nth-child(2) > a', btn => btn.click()),
                        page.waitForNavigation({waitUntil: 'networkidle2'})
                    ]);

                    for (let j = 0; j < 1; j++) {
                        
                        await write('textarea', faker.company.bs())

                        const forms = await page.$$('form[action*="comment.php"]')

                        await Promise.all([
                            forms[0].$eval('input[type="submit"]', btn => btn.click()),
                            page.waitForNavigation({waitUntil: 'networkidle2'})
                        ]);
                    }
                }
                i++
            } while (i < 3)
            
        }

        async function reaction(group, likeOnly) {

            let articles =  [], i = 0
            group = await group.replace('web','mbasic')

            try {
                await page.goto(group, { waitUntil: 'networkidle2' });
            } catch (error) {
                console.log("Je n'arrive pas à me connecter à facebook"); return;
            }
            
            do {
                try {
                    await page.waitForFunction(() => document.querySelectorAll('section > article > footer').length);
                    await page.waitForTimeout(DEFAULT_TIMEOUT)
                    articles = await page.$$('section > article > footer')
                } catch (error) {
                    console.log(error)
                }

                if (articles.length > 0) {
                    const r = await articles[i].$$('div:nth-child(2) span a')
                    const alreadyLiked = (await articles[i].$$('div:nth-child(2) span a[style]')).length
                    await scrollDownElement(articles[i])

                    if(r.length > 0 && alreadyLiked == 0){
                        let action_id = 0
                        if(r.length > 2) action_id = !likeOnly ? 2 : 1
                        else action_id = !likeOnly ? 1 : 0

                        await Promise.all([
                            r[action_id].click(),
                            page.waitForNavigation({waitUntil: 'networkidle2'})
                        ]);

                        if(!likeOnly){
                            const random = randomInt(0,6)
                            await page.waitForFunction(() => document.querySelectorAll('ul > li a').length > 7 );
                            await (await page.$$('ul > li a'))[random].click()
                        }
                    }
                }
                i++
            } while (i < articles.length)

            console.log('--------------------------------Fin d\'execution---------------------------------');
            
        }

        async function write(el,text)
        {
            await page.waitForSelector(el)
            await scrollDown(el)
            // await page.evaluate( (input) => document.querySelector(input).innerText = "", el)
            await page.focus(el)
            await page.waitForTimeout(DEFAULT_TIMEOUT)
            await page.keyboard.type(text)
            await page.waitForTimeout(DEFAULT_TIMEOUT)
        }

        async function click_btn(el)
        {
            await page.waitForSelector(el)
            await scrollDown(el)
            await page.waitForTimeout(DEFAULT_TIMEOUT)
            await page.$eval(el, btn => btn.click());
        }

        async function scrollDown(selector) {
            await page.$eval(selector, e => {
                e.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            });
        }

        async function scrollDownElement(el){
            await page.evaluate((e)=>{
                e.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
            }, el)
        }

        async function pause(){
            await page.waitForFunction(() => {
                return (document.getElementsByClassName("pauseb")[0].innerText.includes("Pause") || document.getElementsByClassName("stopb")[0].innerText.includes("Stopping..."))
            }, {timeout : 0 /*, polling:'mutation'*/})
            //.catch((e) => {})
        }

        async function passer(){
            await page.waitForFunction(() => {
                return (document.getElementsByClassName("pauseb")[0].innerText.includes("Pause") || document.getElementsByClassName("stopb")[0].innerText.includes("Stopping..."))
            }, {timeout : 0 /*, polling:'mutation'*/})
            //.catch((e) => {})
        }

        async function stop(){
            const element = (await page.$$('.stopb'))[0]
            var stop_text = await page.evaluate(el => el.innerText, element)
            return await (stop_text.trim().includes('Stopping...'))
        }

        async function setCssAndJs(pf){
            //await pf.addStyleTag({path: `public/assets/sweetalert2.css`})
            //await pf.addStyleTag({path: `public/assets/custom.css`})
            await pf.addScriptTag({url: `https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js`})
            await pf.addStyleTag({url: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css`})
            // await pf.addScriptTag({path: `public/assets/sweetalert2.js`})
            //await pf.addScriptTag({url: `https://cdn.jsdelivr.net/npm/sweetalert2@11`})
            //await pf.addScriptTag({path: `public/assets/custom.js`})
        }

        async function attendre(sec) {
            var i = 0, opt = {};
            if(sec == 0) return await new Promise(resolve => resolve(''));

            await page.evaluate((s)=>{

                window.document.getElementsByClassName('stopb')[0].remove()
                window.document.getElementById('btns').insertAdjacentHTML('beforeend','<button class="btn_bot passb"><span>Passer<small id="passval" style="display:none">0</small></span> <i class="fa fk fa-angle-double-right"></i></button>')
                window.document.getElementById('btns').insertAdjacentHTML('afterbegin','<button class="btn_bot attb"><i class="fa fa-spinner fa-spin"></i> <span> '+s+' </span></button>')
                window.document.getElementsByClassName('passb')[0].addEventListener('click', (e)=>{
                    window.document.getElementById('passval').innerText = "1"
                })
            }, sectotime(sec))
            
            return await new Promise(resolve => {
                var counter = setInterval(async function() {
                    opt =  await page.evaluate(()=> ({
                        isPaused : document.getElementsByClassName("pauseb")[0].innerText.includes("Play"),
                        isPassed : parseInt(document.getElementById('passval').innerText)
                    }))

                    if(opt.isPassed) { await resetCounter(counter) ; resolve('') }

                    if(!opt.isPaused){
                        process.stdout.clearLine();  // clear current text
                        process.stdout.cursorTo(0);  // move cursor to beginning of line
                        i = (i + 1) % 4;
                        var dots = new Array(i + 1).join(".");
                        process.stdout.write("(" + sectotime(sec) +") Attendre" + dots);  // write text
                        sec =  sec - 1
                        if(sec > 0) {
                            await page.evaluate((s)=>{
                                window.document.querySelectorAll('.attb > span')[0].innerText =  ' '+s+' '
                            }, sectotime(sec))
                        } else {
                            await resetCounter(counter)
                            resolve('')
                        }
                    }
                }, 1000);
            })

        }

        async function resetCounter(c){
            clearInterval(c)
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            await page.evaluate(()=>{
                window.document.getElementById('btns').insertAdjacentHTML('beforeend','<button class="btn_bot stopb"><i class="fa fk fa-stop"></i> <span>Stop</span></button>')
                window.document.getElementsByClassName('passb')[0].remove()
                window.document.getElementsByClassName('attb')[0].remove()
                window.document.getElementsByClassName('stopb')[0].onclick = function() {
                    const span = this.querySelector('span')
                    if(span.innerText=='Stop'){
                        span.innerText = 'Stopping...'
                        document.getElementById("myModal").style.width = "100%"
                    } else {
                        span.innerText = 'Stop'
                    }
                }
            })
        }

        async function setModalAlert(pg,i,j,k,o){
            await setCssAndJs(pg)
            await pg.evaluate((i,j,k,o,h)=>{
                $(document).ready(function(){
                    let out = '<style>.modal {display: block; position: fixed; z-index: 1; left: 0; bottom: 0; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); } .titleb {position: relative; max-width: 100%; margin-bottom: 15px; padding: 0 2.5em 0; color: #fff; font-size: 1em; font-weight: 600; text-align: center; text-transform: none; word-wrap: break-word; }.modal-content {font-family : Poppins, sans-serif; font-size: 22px; background: -webkit-linear-gradient(top, #357edc, #1c80e9, #21cefd, #0b84ff); margin: auto auto 10px 10px; padding: 20px; border: 1px solid #888; width: 20%; left: 0; bottom: 0; position: inherit; border-radius: 10px; } #btns,#btns_att {text-align: center; padding-left:-10px;} .btn_bot {border: 0; border-radius: 0.5em; background: initial; color: #fff; font-size: 14px; opacity: 1; margin: 0.3125em; padding: 0.5em 1em; transition: box-shadow 0.1s; box-shadow: 0 0 0 3px transparent; font-weight: 500; cursor: pointer; } .attb { background-color : #6c757d; margin-right : 5px } .pauseb {background-color : #2374e1 } .stopb {background-color : #e41e3f ; margin-left : 5px } .passb{background-color : #e2e6ea ; font-weight : 500; margin-left : 5px;  border-color: #e2e6ea ; color : #5a6268} .text_bot {color: #5a6268; background-color: #ffe484; display: inline-block; padding: .25em .4em; font-size: 12px; font-weight: 700; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: .25rem; } .fa.fk{margin-right:2px} .fk + span{ padding-top:2px} </style>'
                    out += '<div id="myModal" class="modal" style="width:100%"><div class="modal-content"><h2 class="titleb"><img src="'+h+'/assets/fb.png" alt="lbc" style="height: 1em;margin-right: 10px;">MY FB BOT</h2><div id="texts" style="margin-bottom: 20px; "><span class="text_bot"> 12 / 100 publications</span><span class="text_bot" style="float: right;margin-top: 10px;">20 / 100 groupes</span></div><div id="btns"><button class="btn_bot pauseb"><i class="fa fk fa-pause"></i> <span>Pause</span></button><button class="btn_bot stopb"><i class="fa fk fa-stop"></i> <span>Stop</span></button></div></div></div>'
                    window.document.body.insertAdjacentHTML("beforeend", out);

                    setTimeout(()=> {
                        var modal = document.getElementById("myModal");
                        var pauseb = document.getElementsByClassName("pauseb")[0];
                        var stopb = document.getElementsByClassName("stopb")[0];

                        pauseb.onclick = function() {
                            if(this.querySelector('span').innerText=='Pause'){
                                this.innerHTML = '<i class="fa fk fa-play"></i> <span>Play</span>'
                                modal.style.width = ""
                            } else {
                                this.innerHTML = '<i class="fa fk fa-pause"></i> <span>Pause</span>'
                                modal.style.width = "100%"
                            }
                        }

                        stopb.onclick = function() {
                            const span = this.querySelector('span')
                            if(span.innerText=='Stop'){
                                span.innerText = 'Stopping...'
                                modal.style.width = "100%"
                            } else {
                                span.innerText = 'Stop'
                            }
                        }

                    },1000)
                });
            },i,j,k,o,url_local)  
        }

    })();

    
}).on('error', (err)=> { 
    console.error(err)
});
