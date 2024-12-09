function warte() { // like a decorator to show 'working...' during the execution
    const pWarning = document.getElementById("warning");
    pWarning.innerText='Working      ';
    pWarning.style.display = 'flex';
    const dots = ['      ', '..    ', '....  ','......']; // damit warning text immer in der Mittel ist und nicht abrutscht
    let ind_dot=0;
    let strLoad = setInterval(function() {
        pWarning.innerText = 'Working' + dots[ind_dot];
        ind_dot = (ind_dot + 1) % dots.length;
    }, 1000);
    return strLoad
}
function warteFertig(strLoad) {
    clearInterval(strLoad);
    document.getElementById("warning").style.display = 'none';
}
function showWarning(str1) {
    const pWarning = document.getElementById("warning");
    pWarning.innerText = str1;
    pWarning.style.display='flex';
    setTimeout(function() {pWarning.style.display = 'none';}, 2500);
}

function selectAll(i1) {
    const checkboxes = [...document.getElementsByClassName('checkbox')]; // xx ... returns an array, so can use forEach
    checkboxes.forEach(checkbox => checkbox.checked = i1 === 1);
}

const removeKW = checkboxId => document.getElementById(checkboxId).remove(); // xx
function addKW() {
    const kw_neu = document.getElementById("add_kw").value;
    if (!kw_neu.trim()) {
        showWarning("Der Suchbegriff darf nicht leer sein");
        return;
    }
    fetch('/add_kw', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({ kw_neu: kw_neu})
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ok) { showWarning(data.warning); } else {
            var ctn = document.querySelector('.ctn-kw');
            var newDiv = document.createElement('div');
            newDiv.className = 'lst_kw ctn-line';
            newDiv.id = data.kw_neu;
            newDiv.innerHTML = `
                <div class="kw">
                    <input type="text" name="${data.kw_neu}" value="${data.kw_neu}" readonly>
                    <input type="button" onclick="removeKW('${data.kw_neu}')" value="Löschen" class="button">
                </div>
            `;
            ctn.appendChild(newDiv);
            document.getElementById("add_kw").value = "";
        }
    })
}
async function updateVar() {
    const von = document.getElementById("von").value, // $("#von").val(), // jQuery
        bis = document.getElementById("bis").value,
        speicher = document.getElementById("speicher").value,
        lst_pt = Array.from(document.querySelectorAll('.checkbox:checked')).map(checkbox => checkbox.value),
        lst_kw = Array.from(document.querySelectorAll(".kw input[type='text']")).map(input => input.value);
        // lst_pt = $(".checkbox:checked").map(function() {return this.value;}).get();
    // $.ajax({
    //     type: "POST",
    //     url: "/update_parameter",
    //     data: { von: von, bis:bis, speicher:speicher, lst_pt:lst_pt},
    //     success: function(response) {console.log(response);},
    //     error: function(error) {console.log(error);}
    // });
    fetch('/update_all', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ von: von, bis:bis, speicher:speicher, lst_pt:lst_pt, lst_kw: lst_kw}),
    })
        .then(response => response.json())
        .then(data => showWarning(data.warning) )
}
async function scrap() {
    // await updateAll();
    const strLoad=warte();
    fetch('/scrap')
    .then(response => response.json())
    .then(result => {
        if ('warning' in result) {
            showWarning(result.warning);}
        displayTable(result.ld);
        warteFertig(strLoad);
    });
}
function tableReload() {
    fetch('/sort_table', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ columnIndex: 0 }),
    })
    .then(response => response.json())
    .then(result => displayTable(result.ld) );
}

// Dt
let rowYellow = new Set();
let rowGreen = new Set();
let rowRed = new Set();
let rowBlue = 0; // Es darf nur eine blue Reihe geben, deshalb ist es ein Nr

function sortTable(columnIndex) { // gut zu haben: color bleibt
    fetch('/sort_table', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ columnIndex: columnIndex }),})
        .then(response => response.json())
        .then(result => displayTable(result.ld) );
}

function displayTable(ld) {
    // idea: wenn man ein Zell in der Spalte 'Vergabestelle' klickt, wird die ganze Reihe gelb markiert, Mit einem zusätzlichen Knopf zu drücken, die ausgewählte Indizien werden nach Backend geschickt. Um die richtige Reihen wieder zu finden, muss das sortierung Kriterium getrackt werden
    const tableContainer = document.getElementById('ctn-table');
    tableContainer.innerHTML='';
    const table = document.createElement('table');
    table.classList.add('ergebnis');
    table.id = 'tb1';
    const tableHead = document.createElement('tr');
    tableHead.innerHTML = `<th onclick="sortTable(0)">Angebotsfrist</th>
    <th onclick="sortTable(1)">Vergabestelle</th>
    <th onclick="sortTable(2)">Titel</th>
    <th onclick="sortTable(3)">Keyword</th>
    <th onclick="sortTable(4)">Portal</th>
    <th>Nr</th>`;
    table.appendChild(tableHead);

    ld.forEach(dct1 => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `<tr>
            <td>${dct1["Angebotsfrist"]}</td>
            <td class="clickable-cell">${dct1["Vergabestelle"]}</td>
            <td><a href=${dct1["URL"]} target="_blank">${dct1["Titel"]}</a></td>
            <td>${dct1["Keyword"]}</td>
            <td>${dct1["Portal"]}</td>
            <td>${dct1["nr"]+1}</td>
        </tr>`; 
        tableRow.addEventListener('click', function(event) {
            if (event.target.classList.contains('clickable-cell')) {
                toggleRowSelection(tableRow, dct1["nr"]);
            }
        });
        table.appendChild(tableRow);
    });
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);
}

function toggleRowSelection(row, ind) {
    if (row.classList.contains('green')) {
        row.classList.add('blue');
        // remove blue from other rows
        const table = document.querySelector('table');
        const rows = table.querySelectorAll('tr');
        rows.forEach((row1,ind1) => {
            // const cellValue = row1.cells[row1.cells.length - 1].textContent.trim();
            if (ind1-1 == rowBlue) {
                row1.classList.remove('blue');
                return;
            }
        });
        rowBlue=ind;
    }
    if (rowYellow.has(ind)) { // 
        row.classList.remove('yellow');
        rowYellow.delete(ind);
    } else {
        row.classList.add('yellow');
        rowYellow.add(ind);
    }
}

function markRow(downloaded, failed) { // table head counts as a row, therefore +1
    const table = document.querySelector('table');
    downloaded.forEach(index => {
        const row = table.rows[index+1];
        row.classList.remove('yellow');
        row.classList.add('green');
    });
    failed.forEach(index => {
        const row = table.rows[index+1];
        row.classList.remove('yellow');
        row.classList.add('red');
    });
}

function download() {
    const strLoad=warte();
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tr');
    const indices = [];
    rows.forEach((row, index) => { // start counting from the row with th, therefore -1
    if (row.classList.contains('yellow')) {
        indices.push(index-1);}
    });
    // const selectedRowIndices = Array.from(selectedRows);
    fetch('/download', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ selectedRows: indices }),
    })
    .then(response => response.json())
    .then(result => {
        markRow(result.downloaded, result.failed);
        warteFertig(strLoad);
    });
}
function wahlExport() {
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tr');
    const farben = ['red', 'yellow', 'green', 'blue'];
    const indices = [];    
    rows.forEach((row, index) => {
        if (farben.some(className => row.classList.contains(className))) {
            indices.push(index - 1);
        }
    });
    fetch('/wahl_export', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify({ selectedRows: indices }),
    });
    showWarning('Ausgewählte Zeile sind exportiert');
}
const url0 = 'http://127.0.0.1:5000/pdf/'; // this pdf is defined in app.py serve pdf, not the folder upload
var apitf=false; // ob api key vorhand ist

const dropArea = document.getElementById('drop-area');
dropArea.addEventListener('click', () => {document.getElementById('fileElem').click();});
dropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
// dropArea.addEventListener('drop', handleDrop, false);
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
}); // Prevent default behaviors for drag and drop events, which opens up pdf files in the browser
function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}
function addFiles2Dropdown(filesOrFilenames, formData = null) {
    const dropdown = document.getElementById('selectPDF');
    dropdown.innerHTML='';
    for (const file of filesOrFilenames) {
        // Check if the item is a File object (drag and drop) or a string (click to select)
        if (formData && file instanceof File) {
            formData.append('file', file);
            var option = document.createElement('option'); // add name to select
            option.value = file.name;
            option.text = file.name;
            dropdown.appendChild(option);
        } else if (typeof file === 'string') {
            var option = document.createElement('option'); // add name to select
            option.value = file;
            option.text = file;
            dropdown.appendChild(option);
        }
    }
    selectPDF();
}
function handleFiles(files) {
    const formData = new FormData();
    addFiles2Dropdown(files, formData)
    fetch('/upload', {method: 'POST', body: formData})
    .then(response => response.json());
}
function selectPDF() {
    var selectedPDF = document.getElementById("selectPDF").value;
    showPDF(selectedPDF, 1);
}
function deletePDF() {
    const formData = new FormData();
    addFiles2Dropdown([], formData)
    fetch('/delete_pdf', {method: 'POST'})
    .then(response => response.text())
    .then(() => {}); //location.reload();
}

function copyPDF() { // die vom System heruntergeladene PDF Datei benutzen
    fetch('/copy_pdf', {method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({indRowBlue:rowBlue})})
    .then(response => response.json()) // update the dropdown menu
    .then(result => {
        addFiles2Dropdown(result.files);
    });
}

function addAPI() {
    const api = document.getElementById("inputAPI").value;
    fetch('/add_api', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({ api: api})
    })
    .then(response => response.json())
    .then(result => {
        if (result.ok) { apitf=true; }
        showWarning(result.warning)
        document.getElementById("inputAPI").value = "";
    });
}

function addFrage() {
    const ff = document.getElementById("inputFrage").value;
    fetch('/add_frage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({ ff: ff})
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            const container = document.getElementById('ctn-qas');
            const newDiv = document.createElement('div');
            newDiv.className = 'qa';
            newDiv.id = data.f1;
            newDiv.innerHTML = `
                <div class="frage">
                    <p>${data.f1}</p>
                    <button type="button" onclick="removeQA('${data.f1}')">Löschen</button>
                </div>
                <p>${data.f2}</p>
            `;
            // <input type="text" name="${data.frage_neu}" value="${data.frage_neu}" readonly>
            container.appendChild(newDiv);
            document.getElementById("inputFrage").value = "";
        } else {
            showWarning(data.warning)
        }
    })
    .catch(error => console.error('Error:', error));
}

function removeQA(f1) {
    document.getElementById(f1).remove();
    fetch('/remove_frage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({ f1: f1})
    })
    .then(response => response.json());
}

function ask() {
    if (!apitf) {
        showWarning('Bitte erst das API key eingeben');
    } else {
        const strLoad=warte();
        fetch('/ask', {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            const lstQA = data.lst_qa;
            const container = document.getElementById('ctn-qas');
            container.innerHTML='';
            for (const [q, qp, ans] of lstQA) { // xx ans ist a list, loop it over and make for each element a antwort&button pair
                // empty the container
                const newDiv = document.createElement('div');
                newDiv.className = 'qa';
                newDiv.id = q;
                newDiv.innerHTML = `
                    <div class="frage">
                        <p>${q}</p>
                        <button type="button" onclick="vorschau(); removeQA('${q}')">Löschen</button>
                    </div>
                    <p>${qp}</p>
                `;
                ans.forEach((antwort, index) => { // mehrere Antworten einfügen
                    const antwortDiv = document.createElement('div');
                    antwortDiv.className = 'antwort';
                    const isChecked = index === 0 ? 'checked' : ''; // die erste Antwort checken
                    antwortDiv.innerHTML = `
                        <input type="checkbox" class="cb-qa" id="${q}-antwort-${index}" name="${q}-antwort-${index}" ${isChecked} onchange="vorschau()">
                        <label for="${q}-antwort-${index}">${antwort}</label>
                        <button type="button" onclick="quelle('${q}', ${index})">Quelle${index + 1}</button>
                    `;
                    newDiv.appendChild(antwortDiv);
                });
                // Add the fourth antwort div for manual input
                const manualAntwortDiv = document.createElement('div');
                manualAntwortDiv.className = 'antwort';
                manualAntwortDiv.innerHTML = `
                    <input type="checkbox" class="cb-qa" id="${q}-antwort-manual" name="${q}-antwort-manual" onchange="vorschau()">
                    <input type="text" class="antwort" placeholder="Manuelle Antwort">
                `;
                newDiv.appendChild(manualAntwortDiv);
                container.appendChild(newDiv);
            };
            warteFertig(strLoad);
            vorschau();
        });
    }
}

async function quelle(frage, nrAnt) {
    // get the response, including filename, page, text, then show pdf, scroll to the right place later highlight the node
    fetch('/quelle', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({ frage: frage, nrAnt:nrAnt})
    })
    .then(response => response.json())
    .then(data => {
        // highlightName(data.filename)// change underground color of filename
        document.getElementById('selectPDF').value=data.filename;
        showPDF(data.filename, data.pagenr, data.text);}); // 
}

async function showPDF(filename, pagenr, text_chunk='') {
    const url = url0 + filename;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../static/pdf.worker.mjs'; // pdfjs trick
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    const container = document.getElementById('ctn-pdf');
    const containerWidth = container.clientWidth;
    const scaleMonitor = window.devicePixelRatio || 1;
    while (container.firstChild) {container.removeChild(container.firstChild);}

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber),
            viewport = page.getViewport({ scale: 1 }),
            scale_ctn_vp = containerWidth / viewport.width,
            scaledViewport = page.getViewport({ scale: scale_ctn_vp }),
            vp_height=scaledViewport.height;
        
        const divPage=document.createElement("div"); //
        divPage.style.width = Math.floor(scaledViewport.width) + "px";
        divPage.style.height = Math.floor(scaledViewport.height) + "px";

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(scaledViewport.width * scaleMonitor);
        canvas.height = Math.floor(scaledViewport.height * scaleMonitor);
        canvas.style.width = Math.floor(scaledViewport.width) + "px";
        canvas.style.height = Math.floor(scaledViewport.height) + "px";
        const context = canvas.getContext("2d");

        const transform = scaleMonitor !== 1 ? [scaleMonitor, 0, 0, scaleMonitor, 0, 0] : null;
        const renderContext = {
            canvasContext: context,
            transform,
            viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
        // highlight
        const textContent = await page.getTextContent();
        const scale_highlight=canvas.width / scaledViewport.width;
        highlightNode(scaledViewport, scale_highlight, context, textContent, text_chunk);
        container.appendChild(canvas);

        if (pageNumber === pagenr) {
            canvas.scrollIntoView();
        }

    // try scroll
    // var yOffset = vp_height*pagenr;
    // for (var i = 1; i < pagenr; i++) {
    //     yOffset += pdf.getPage(i).then(function(p) {
    //         return p.getViewport({ scale: 1 }).height;
    //     });
    //     console.log(i);
    // }
    // console.log(yOffset);
    // container.scrollTop = yOffset;

        // Create text layer div
        // const divText = document.createElement("div");
        // divText.className = "textLayer";
        // divText.style.width = canvas.style.width;
        // divText.style.height = canvas.style.height;

        // const textContent = await page.getTextContent();
        // pdfjsLib.renderTextLayer({
        //     textContent: textContent,
        //     container: divText,
        //     viewport: scaledViewport,
        //     textDivs: []
        // });
        // pdfjsLib.TextLayer({
        //     // textContent: textContent,
        //     container: divText,
        //     // viewport: scaledViewport,
        //     textDivs: []
        // });
        // divPage.appendChild(canvas);
        // divPage.appendChild(divText);
        // container.appendChild(divPage);
        // if (pageNumber === pagenr) {
        //     divPage.scrollIntoView();
        // }

    }
}
const normalizeText = text => text.replace(/[\W_]+/g, '').toLowerCase();
// Remove all non-alphanumeric characters and convert to lowercase
function highlightNode(viewport, scale_highlight, context, textContent, text_chunk) {
    // const normalizedHighlightText = normalizeText(highlightText);

    textContent.items.forEach(item => {
        const text_line = item.str;
        const text_line_norm = normalizeText(text_line);

        if (text_chunk.includes(text_line)) {
        // if (1){
            const tx0=pdfjsLib.Util.transform(viewport.transform, item.transform);
            const offsetM=0;
            
            context.fillStyle = 'rgba(255, 255, 0, 0.3)';
            let rect1=[tx0[4], tx0[5]-item.height, item.width, item.height];
            let rect2 = rect1.map(value => Math.round(value * scale_highlight)); // xx
            rect2[1]=rect2[1]-offsetM; // xx
            context.fillRect(...rect2);
        }
    });
}
function vorschau() {
    const selectedAnswersContainer = document.getElementById('ctn-vorschau');
    selectedAnswersContainer.innerHTML = ''; // Clear previous content
    const qaDivs = document.querySelectorAll('#ctn-qas .qa'); // Get all QA divs within the 'ctn-qas' container
    qaDivs.forEach((qaDiv) => {
        // Get and append the question paragraph
        const question = qaDiv.querySelector('.frage p').innerText;
        const questionParagraph = document.createElement('p');
        questionParagraph.innerText = question;
        selectedAnswersContainer.appendChild(questionParagraph);
        // Get all checkboxes within the current QA div
        const checkboxes = qaDiv.querySelectorAll('input[type="checkbox"]:checked');
        // Loop through each selected checkbox
        checkboxes.forEach((checkbox) => {
            let answerText = '\n';
            const label = checkbox.nextElementSibling; // Get the associated label
            if (label && label.tagName.toLowerCase() === 'label') {
                answerText = label.innerText; // Get the label text
            } else {
                const input = label && label.tagName.toLowerCase() === 'input' ? label : checkbox.nextElementSibling.nextElementSibling; // Get the manual input
                answerText = input ? input.value : '';
            }
            // Create a new paragraph and add the answer text
            const answerParagraph = document.createElement('p');
            answerParagraph.innerText = answerText;
            selectedAnswersContainer.appendChild(answerParagraph);
        });
        const lineBreak = document.createElement('br');
        selectedAnswersContainer.appendChild(lineBreak);
    });
}
function qaExport() {
    const strLoad=warte();
    const öffnen=document.getElementById('öffnen').checked;
    const selectedAnswersContainer = document.getElementById('ctn-vorschau');
    const children = selectedAnswersContainer.childNodes;
    const answers = [];
    children.forEach(child => {
        if (child.nodeName === 'P') {
            answers.push(child.innerText);
        } else if (child.nodeName === 'BR') {
            answers.push('');
        }
    });
    fetch('/qa_export', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ ergebnis: answers, öffnen: öffnen })
    })
    .then(response => response.json())
    .then(data => {
        warteFertig(strLoad);
    });
}
const openFolder = () => fetch('/open_folder');

function backup_exportieren1() { // export from backend information, without frontend
    fetch('/qa_export', {method: 'POST'})
    .then(response => response.json())
    .then(data => {console.log(data.message);});
}

function backup_downloaded_failed () {
    const downloadedContainer = document.getElementById('downloaded-container');
    const failedContainer = document.getElementById('failed-container');
    downloadedContainer.innerHTML = '';
    failedContainer.innerHTML = '';

    // Create checkboxes for downloaded list
    const title = document.createElement('h3');
    title.textContent = 'Downloaded';
    title.id='title-download';
    downloadedContainer.appendChild(title);
    result.downloaded.forEach((item, index) => {
        const label = document.createElement('label');
        label.setAttribute('for', `downloaded-${index}`);
        label.textContent = item;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = `downloaded-${index}`;
        radio.name = 'downloaded';
        radio.value = item;
        if (index === 0) {
            radio.checked = true; // Make the first option selected by default
        }

        downloadedContainer.appendChild(radio);
        downloadedContainer.appendChild(label);
        downloadedContainer.appendChild(document.createElement('br'));
    });

    // Create paragraphs with hyperlinks for failed list
    result.failed.forEach(item => {
        const paragraph = document.createElement('p');
        const link = document.createElement('a');
        link.href = item; // Assuming the item is the URL
        link.textContent = item;
        link.target = '_blank';

        paragraph.appendChild(link);
        failedContainer.appendChild(paragraph);
    });
}

window.selectAll=selectAll
window.removeKW=removeKW
window.addKW=addKW
window.updateVar=updateVar
window.scrap=scrap
window.tableReload=tableReload
window.sortTable=sortTable
window.download=download
window.wahlExport=wahlExport
window.copyPDF=copyPDF

window.removeQA=removeQA; // workaround, um pdfjs zu benutzen, dieses scripts.js Datei muss eine Module sein. Aber in diesem Module, muss alle Funktionen global gemacht werden.
window.deletePDF = deletePDF;
window.addFrage=addFrage;
window.addAPI=addAPI;
window.ask=ask;
window.showPDF=showPDF;
window.quelle=quelle;
window.handleFiles=handleFiles;
window.selectPDF=selectPDF;
window.vorschau=vorschau;
window.openFolder=openFolder;
window.qaExport=qaExport;
// window.showWarning=showWarning;