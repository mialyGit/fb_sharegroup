
function show_table2(json){
    var data = []
    if(json == null) return

    if(!checkedValidObj(json)) {
        if(json.title && json.message && json.type)
            swal(json.title,json.message,json.type)
        else  swal("Je n'arrive pas à me connecter à facebook","Veuillez relancer le bot","error")
        return
    }

    data = json.grps

    window.document.querySelectorAll('.username')[0].innerHTML = json.username
    window.document.getElementById('lang').value = json.lang

    if(data.length>0) {
        let table = $('#table_data');
        let out = '<div class="row m-b-10"><div id="serch" class="col"></div><div class="col text-center">Nombre de groupe : <strong class="nbr_grp"> '+(data.length)+' </strong></div><div class="col text-right"><button class="btn btn-sm btn-dark rmgr10top mr-4"> <i class="fa fa-sm fa-trash"></i> &#x2B06; Delete 10 from top</button><button class="btn btn-sm btn-dark rmgr10bottom"> <i class="fa fa-sm fa-trash"></i> &#x2B07; Delete 10 from bottom</button></div></div>'
        out += '<div class="row"><div class="col"><table id="mydata" class="table-borderless table-data3" style="width:100%"><thead><tr>';
        out += '<th>#</th><th>Options</th><th>GROUPE</th></tr></thead><tbody>';
        
        for (let i = 0; i < data.length; i++) {
            out += '<tr class="row_data"><td>'+(i+1)+'</td><td><button class="btn btn-danger btn-sm rmgr"><i class="fa fa-sm fa-trash"></i></button> <button class="btn btn-primary btn-sm upgr">&#x2B06;</button> <button class="btn btn-dark btn-sm dwgr">&#x2B07;</button></td><td> <img class="mr-4" src="'+data[i].icon+'" width="25" height="25"> <a target="_blank" href="'+data[i].url+'">'+data[i].name+'</a></td></tr>';
        }

        out += '</tbody> </table></div></div>';
        out += '<div class="row m-t-10"><div class="col"></div><div class="col text-center">Nombre de groupe : <strong class="nbr_grp"> '+(data.length)+' </strong></div><div class="col text-right"><button class="btn btn-sm btn-dark rmgr10top mr-4"> <i class="fa fa-sm fa-trash"></i> &#x2B06; Delete 10 from top</button><button class="btn btn-sm btn-dark rmgr10bottom"> <i class="fa fa-sm fa-trash"></i> &#x2B07; Delete 10 from bottom</button></div></div>'
        table.append(out);

        updatetimerun();

        for (let i = 0; i < data.length; i++) {
            window.document.querySelectorAll("td .rmgr")[i].addEventListener("click", function(){
                getParents(this)[1].remove();
                reset_data_input_search()
                updatetimerun()
            });
            window.document.querySelectorAll("td .upgr")[i].addEventListener("click", function(){
                moveUp(getParents(this)[1]);
            });
            window.document.querySelectorAll("td .dwgr")[i].addEventListener("click", function(){
                moveDown(getParents(this)[1]);
            });
        }

        let url_input = window.document.querySelectorAll("input[name='url']")[0].value
        window.document.querySelectorAll("input[name='url']")[0].value = url_input.split('/?')[0]

        window.document.querySelectorAll("input[name='url']")[0].addEventListener("paste", function(e){
            e.preventDefault()
            let paste = (e.clipboardData || window.clipboardData).getData('text');
            let arr = window.document.querySelectorAll("input[name='url']")[0].value.split(' ')
            arr[arr.length-1] = paste.split('/?')[0]
            this.value = arr.join(' ')
        });
        
        window.document.querySelectorAll("input[name='url']")[0].addEventListener("blur", function(){
            updatetimerun();
        });
        
        window.document.querySelectorAll(".ap")[0].addEventListener("blur", function(){
            updatetimerun();
        });

        window.document.querySelectorAll("input[name='every']")[0].addEventListener("blur", function(){
            updatetimerun();
        });
        window.document.querySelectorAll("input[name='waitbefore']")[0].addEventListener("blur", function(){
            updatetimerun();
        });
        window.document.querySelectorAll("input[name='between']")[0].addEventListener("blur", function(){
            updatetimerun();
        });

        window.document.querySelectorAll(".aq")[0].addEventListener("focus", function(){
            groups_filter = this;
            groups_filter.classList.remove("is-invalid")

            var groups_length = window.document.querySelectorAll('.row_data').length;
            if(groups_length>0){
                var groups_id = [];
                var gr = window.document.querySelectorAll(".row_data a");
                for(i in gr){ 
                    if ( !isNaN(i) ) {
                        groups_id.push(gr[i].href.split('/').slice(-1)[0]);
                    }
                } 
                groups_filter.value = groups_id.join('/');
                //groups_filter.className += " ar";
                groups_filter.select();
                //groups_filter.classList.remove('ar');
            }
             //onmouseup=\"this.classList.remove('ar');return false;
        });

        window.document.querySelectorAll(".av")[0].addEventListener("focus", function(){
            export_filter = this;
            export_filter.classList.remove("is-invalid")

            var export_url = window.document.querySelectorAll("input[name='url']")[0].value;    
            var export_content = window.document.querySelectorAll(".ap")[0].value;
            var export_hashtag = window.document.querySelectorAll("input[name='hashtag']")[0].value;    
            var export_url_alt = window.document.querySelectorAll("input[name='url_alt']")[0].value;
            var export_group = '';
            var export_group_length = window.document.querySelectorAll('.row_data').length;
            if(export_group_length>0){
                var groups_id = [];
                var gr = window.document.querySelectorAll(".row_data a");
                for(i in gr){ 
                    if ( !isNaN(i) ) {
                        groups_id.push(gr[i].href.split('/').slice(-1)[0]);
                    }
                } 
                export_group = groups_id.join('/');
            }
            export_group = export_group.replace('"', '\\"');
        
            var export_time1 = 0;
            var export_time2 = 0;
            var export_waitbefore = parseInt(window.document.querySelectorAll("input[name='waitbefore']")[0].value);
            var export_every = parseInt(window.document.querySelectorAll("input[name='every']")[0].value);
            var export_between = parseInt(window.document.querySelectorAll("input[name='between']")[0].value);
            var silent_mode = window.document.querySelectorAll("input[name='silent']")[0];
            var export_silent_mode = 0;
            if(silent_mode.checked) export_silent_mode = 1;
            export_filter.value = export_url+"|"+export_content+"|"+export_hashtag+"|"+export_url_alt+"|"+export_group+"|"+export_time1+"|"+export_time2+"|"+export_waitbefore+"|"+export_every+"|"+export_between+"|"+export_silent_mode;
            export_filter.select();
        });

        window.document.querySelectorAll(".buttav")[0].addEventListener("click", function(){
            if (window.document.querySelectorAll(".av")[0].value != '') {
                import_filter = window.document.querySelectorAll(".av")[0].value.split('|');
        
                window.document.querySelectorAll("input[name='url']")[0].value = import_filter[0];
                window.document.querySelectorAll(".ap")[0].value = import_filter[1];
                window.document.querySelectorAll("input[name='hashtag']")[0].value = import_filter[2];
                window.document.querySelectorAll("input[name='url_alt']")[0].value = import_filter[3];
                window.document.querySelectorAll(".aq")[0].value = import_filter[4];
        
                groups_filter = window.document.querySelectorAll(".aq");
                
                if (groups_filter[0].value != '') {        
                    filter = groups_filter[0].value.split('/');
                    var groups_length = window.document.querySelectorAll('.row_data a').length;
                    if(groups_length>1){            
                        filter.reverse();
                        for(j in filter){ 
                            if(!isNaN(j)) {
                                var gr = window.document.querySelectorAll(".row_data");
                                for (let i = 0; i < gr.length; i++) {
                                    const id_groupe = gr[i].querySelector('a').href.split('/').slice(-1)[0]
                                    if(!isNaN(i) && filter.indexOf(id_groupe) === -1 ) {
                                        gr[i].remove();
                                    }
                                    if(!isNaN(i) && filter[j] == id_groupe) {
                                        moveUp(gr[i]);
                                    }
                                } 
                            } 
                        } 
                    }
                }
        
                //window.document.querySelectorAll("input[name='sd']")[0].value = import_filter[5];
                //window.document.querySelectorAll("input[name='ss']")[0].value = import_filter[6];
                window.document.querySelectorAll("input[name='waitbefore']")[0].value = import_filter[7];;
                window.document.querySelectorAll("input[name='every']")[0].value = import_filter[8];
                window.document.querySelectorAll("input[name='between']")[0].value = import_filter[9];
                if (import_filter[10] == 0) window.document.querySelectorAll("input[name='silent']")[0].checked = false;
                if (import_filter[10] == 1) window.document.querySelectorAll("input[name='silent']")[0].checked = true;
                updatetimerun();
                reset_data_input_search();

            }
            else {
                window.document.querySelectorAll(".av")[0].classList.add("is-invalid");;
            }
        
        });

        window.document.querySelectorAll('.filtergroup')[0].addEventListener("click", function(){
            groups_filter = window.document.querySelectorAll(".aq");
            if (groups_filter[0].value != '') {        
                filter = groups_filter[0].value.split('/');
                var groups_length = window.document.querySelectorAll('.row_data a').length;
                if(groups_length>1){            
                    filter.reverse();
                    for(j in filter){ 
                        var gr = window.document.querySelectorAll(".row_data");
                        for (let i = 0; i < gr.length; i++) {
                            const id_groupe = gr[i].querySelector('a').href.split('/').slice(-1)[0]
                            if(!isNaN(i) && filter.indexOf(id_groupe) === -1 ) {
                                gr[i].remove();
                            }
                            if(!isNaN(i) && filter[j] == id_groupe) {
                                moveUp(gr[i]);
                            }
                        } 
                    } 
                    updatetimerun();
                    reset_data_input_search();
                }
            }
            else {
                groups_filter[0].classList.add("is-invalid");
            }
        });

        var rmgr10top = window.document.querySelectorAll('.rmgr10top');
        var rmgr10bottom = window.document.querySelectorAll('.rmgr10bottom');
    
        rmgr10top.forEach(function(elem) {
            elem.addEventListener("click", function(){       
                var groups_length = window.document.querySelectorAll('.row_data').length;
                if(groups_length>10){
                    var gr = window.document.querySelectorAll(".row_data");
                    for(i in gr){ 
                        if(!isNaN(i) && (i < 10)){
                            gr[i].remove();
                        }
                        if(!isNaN(i) && (i >= 10)) break;   
                    } 
                    updatetimerun();
                    reset_data_input_search()
                }
                else {
                    /*rmgr10top.forEach(function(elem1) {
                        elem1.remove();
                    });
                    rmgr10bottom.forEach(function(elem1) {
                        elem1.remove();
                    });*/
                }   
            });
        });
    
        rmgr10bottom.forEach(function(elem) {
            elem.addEventListener("click", function(){
     
                var groups_length = window.document.querySelectorAll('.row_data').length;
                if(groups_length>10){
                    var gr = window.document.querySelectorAll(".row_data");
                    for(i in gr){ 
                        if(!isNaN(i) && (i >= (groups_length-10))){
                            gr[i].remove();
                        }
                    } 
                    updatetimerun();
                    reset_data_input_search()
                }
                else {
                    /* rmgr10top.forEach(function(elem1) {
                        elem1.remove();
                    });
                    rmgr10bottom.forEach(function(elem1) {
                        elem1.remove();
                    });*/
                } 
            });
        });

        document.getElementById('serch').insertAdjacentHTML('afterbegin', '<select id="dlist" class="form-control"></select>')
        reset_data_input_search()

        $(document).on("focus", ".select2", function() {
            setTimeout(() => {
                $("#dlist").val(null).change()
            }, 500);
        });

        $("#dlist").select2({
            placeholder: '<i class="fa fa-search"></i>  Rechercher un groupe',
            escapeMarkup: function(m) { 
               return m; 
            }
          }).on("change", function (e) {
            const index  = parseInt($(this).val());
            if(!isNaN(index)){
                moveUp(window.document.querySelectorAll(".row_data")[index]);
                reset_data_input_search()
                reset_table()
            }

        });

        } else {
            swal("Je n'ai trouvé aucune groupe sur ton compte","","warning")
        }

}

function checkedValidObj(obj){
    return (obj["username"] !== undefined && obj["lang"] !== undefined && obj["grps"] !== undefined)
}

function reset_table(){
    var table   = document.getElementById('mydata');
    for (var i = 1; i < table.rows.length; i++) 
    {
    var firstCol = table.rows[i].cells[0];
    firstCol.innerText = i;
    }
}

function reset_data_input_search()
{
    var gr = window.document.querySelectorAll(".row_data a");
    var datalist = '<option></option>'
    for(i in gr){
        if(!isNaN(i)){
            datalist += '<option value="'+i+'">'+gr[i].innerText+'</option>'
        }
    }
    $('#dlist').html(datalist)
}

function onInput() {
    var val = document.getElementById("dlist").value;
    var opts = document.getElementById('dlist').querySelectorAll('option');
    for (var i = 0; i < opts.length; i++) {
        if (opts[i].innerText == val) {
            moveUp(getParents(window.document.querySelectorAll("h3 .upgr")[i])[4]);
            reset_data_input_search()
            document.getElementById("serch").blur()
            break;
        }
    }
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

function updatetimerun(){
    window.document.querySelectorAll(".nbr_grp")[0].innerHTML = ' '+window.document.querySelectorAll(".row_data").length+' '
    window.document.querySelectorAll(".nbr_grp")[1].innerHTML = ' '+window.document.querySelectorAll(".row_data").length+' '
    reset_table()
    // window.document.querySelectorAll(".run")[0].innerHTML="Run The Script Post in "+window.document.querySelectorAll("h3 a").length+" Groups / "+((window.document.querySelectorAll("input[name='url']")[0].value.match(/\s/g) || []).length+1)+" / "+((window.document.querySelectorAll(".ap")[0].value.match(/\//g) || []).length+1);
    // window.document.querySelectorAll(".run")[1].innerHTML="Run The Script Post in "+window.document.querySelectorAll("h3 a").length+" Groups / "+((window.document.querySelectorAll("input[name='url']")[0].value.match(/\s/g) || []).length+1)+" / "+((window.document.querySelectorAll(".ap")[0].value.match(/\//g) || []).length+1);
    gt = approx_time2(window.document.querySelectorAll(".row_data a").length);
    window.document.querySelectorAll(".dl")[0].innerHTML = gt;
    // window.document.querySelectorAll(".dl")[1].innerHTML=gt;
    // return gt;
}

function approx_time2(nb) {
    let page_loading = 35, page_loading_max = 40;
    let url_length = window.document.querySelectorAll("input[name='url']")[0].value.split(' ').length
    let between = parseInt(window.document.querySelectorAll("input[name='between']")[0].value);
    let every = parseInt(window.document.querySelectorAll("input[name='every']")[0].value);
    let waitbefore = parseInt(window.document.querySelectorAll("input[name='waitbefore']")[0].value);

    window.document.querySelectorAll(".waitbefore_text")[0].innerHTML = sectotime(waitbefore) || '0s';
    window.document.querySelectorAll(".between_text")[0].innerHTML = sectotime(between) || '0s';
    window.document.querySelectorAll(".every_text")[0].innerHTML = every || '';

    every_count = Math.floor(nb/every);
    const_boucle = (nb * waitbefore - every_count*waitbefore) + every_count*between
    let min = url_length * (page_loading*nb + const_boucle)
    let max = url_length * (page_loading_max*nb + const_boucle)
    if(min && max)
        return sectotime(min) + " à " + sectotime(max);
    else return '00mn 00s'     
}

function getAllUrl(str) {
    var url = [];
    geturl = new RegExp("(^|[ \t\r\n])((http|https):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))", "g");
    url = str.match(geturl).map(e=>e.trim());
    return url;
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
}

function getParents(el) {
    var parents = [];
    var p = el.parentNode;
    while (p !== null) {
        var o = p;
        parents.push(o);
        p = o.parentNode;
    }
    return parents;
}


function short_now() {
    var d = new Date();
    return [pad(d.getFullYear()), pad(d.getMonth()+1), pad(d.getDate())].join('-')+" "+d.toLocaleTimeString();
}

function moveUp(element) {
    if(element.previousElementSibling)
      element.parentNode.insertBefore(element, element.parentNode.firstElementChild);
}

function moveDown(element) {
if(element.nextElementSibling)
    element.parentNode.insertBefore(element.nextElementSibling, element);
}

function gup( name, url ) {
    if (!url) url = location.href
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    return results == null ? null : results[1];
  }
  
  
String.prototype.cleanup = function() {
    return this.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
}
