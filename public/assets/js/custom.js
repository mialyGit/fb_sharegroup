// const Waiting = Swal.mixin({
//     position: 'center',
//     showConfirmButton: false,
//     allowOutsideClick: false,
//     width: '300px',
//     text: "Veuillez patientez",
//     imageUrl: "assets/images/loading2.gif",
//     imageWidth: 50,
//     imageHeight: 50,
// })

function escapeCharacter(str){
    var escapre_accent =  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

    var arr = escapre_accent.split(/\b\s+/);

    for (var i = 0; i < arr.length; i++) {
        var lastChar = arr[i].substr(arr[i].length - 1);
        if(lastChar=='S'){
            arr[i] = arr[i].slice(0,-1);
        }
    }
    return arr.join(' ');
}