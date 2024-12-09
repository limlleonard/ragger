/** this pdf is defined in app.py serve pdf, not the folder upload */
const url0 = 'http://127.0.0.1:5000/pdf/';
var apitf=false;

/**
 * Displays a 'Working...' message with animated dots during execution. like a decorator
 * 
 * @returns {number} The interval ID which can be used to stop the animation.
 */
function warte() {
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
/**
 * Stops the 'Working...' message animation and hides the warning element.
 * 
 * @param {number} strLoad - The interval ID returned by the `warte` function.
 */
function warteFertig(strLoad) {
    clearInterval(strLoad);
    document.getElementById("warning").style.display = 'none';
}
/**
 * Displays a warning message for a set duration.
 * @param {string} str1 - The warning message to display.
 */
function showWarning(str1) {
    const pWarning = document.getElementById("warning");
    pWarning.innerText = str1;
    pWarning.style.display='flex';
    setTimeout(function() {pWarning.style.display = 'none';}, 2500);
}

const dropArea = document.getElementById('drop-area');
dropArea.addEventListener('click', () => {document.getElementById('fileElem').click();});
dropArea.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files), false);
// dropArea.addEventListener('drop', handleDrop, false);
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
});
/** Prevent default behaviors for drag and drop events, which opens up pdf files in the browser */
function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
}
/**
 * Adds files to the dropdown menu.
 * @param {FileList|string[]} filesOrFilenames - The files (click to select) or filenames (drag & drop) to add.
 * @param {FormData} [formData=null] - The form data to append the files to.
 */
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
/**
 * Call 'upload' to add selected file to server folder
 * @param {FileList} files - The files selected.
 */
function handleFiles(files) {
    const formData = new FormData();
    addFiles2Dropdown(files, formData)
    fetch('/upload', {method: 'POST', body: formData})
    .then(response => response.json());
}
/**Selects the PDF from the dropdown menu and displays it.*/
function selectPDF() {
    var selectedPDF = document.getElementById("selectPDF").value;
    showPDF(selectedPDF, 1);
}
/**Remove all PDF in the server folder */
function deletePDF() {
    const formData = new FormData();
    addFiles2Dropdown([], formData)
    fetch('/delete_pdf', {method: 'POST'})
    .then(response => response.text())
    .then(() => {}); //location.reload();
}
/** Call 'add_api', Adds an API key by sending it to the server. */
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
async function frag() {
    const strLoad=warte();
    const inputElement = document.getElementById("inputFrage");
    const questionText = inputElement.value.trim();
    inputElement.value = "";
    if (!questionText) {
		alert("Bitte geben Sie eine Frage ein.");
		return;
    }
    // Add the question to the container
    const questionDiv = document.createElement("div");
    questionDiv.className = "question";
    questionDiv.innerHTML = `<p>${questionText}</p>`;
    document.getElementById("ctn-qas1").appendChild(questionDiv);

    // Fetch the answer from the Flask server
    try {
		const response = await fetch("/frag", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question: questionText }),
		});

		if (!response.ok) {
			throw new Error("Server error while fetching the answer.");
		}

		const data = await response.json();
		const answerText = data.answer || "Keine Antwort erhalten.";

		// Add the answer to the container
		const answerDiv = document.createElement("div");
		answerDiv.className = "answer";
		answerDiv.innerHTML = `<p>${answerText}</p>`;
		document.getElementById("ctn-qas1").appendChild(answerDiv);
        showPDF(data.filename, data.pagenr, data.text);
        warteFertig(strLoad);
    } catch (error) {
		console.error("Error fetching the answer:", error);
		const errorDiv = document.createElement("div");
		errorDiv.className = "answer";
		errorDiv.innerHTML = `<p>Fehler beim Abrufen der Antwort. Bitte versuchen Sie es erneut.</p>`;
		document.getElementById("ctn-qas1").appendChild(errorDiv);
        warteFertig(strLoad);
    }
}
/**
 * Displays the specified PDF with highlighting and page navigation.
 * @param {string} filename - The name of the PDF file.
 * @param {number} pagenr - The page number to display.
 * @param {string} [text_chunk=''] - The text chunk to highlight.
 */
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
/**Remove all non-alphanumeric characters and convert to lowercase */
const normalizeText = text => text.replace(/[\W_]+/g, '').toLowerCase();
/**
 * Highlights the specified text in the PDF.
 * @param {Object} viewport - The viewport of the PDF page.
 * @param {number} scale_highlight - The scale factor for highlighting.
 * @param {CanvasRenderingContext2D} context - The canvas rendering context.
 * @param {Object} textContent - The text content of the PDF page.
 * @param {string} text_chunk - The text chunk to highlight.
 */
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
window.deletePDF = deletePDF;
window.addAPI=addAPI;
window.showPDF=showPDF;
window.handleFiles=handleFiles;
window.selectPDF=selectPDF;
window.frag=frag;
// window.showWarning=showWarning;