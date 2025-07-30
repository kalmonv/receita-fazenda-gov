// ==UserScript==
// @name         REDESIM
// @namespace    http://tampermonkey.net/
// @version      1
// @description  try to take over the world!
// @author       KalmonV
// @match        https://solucoes.receita.fazenda.gov.br/*/cnpjreva/Cnpjreva_Comprovante.asp
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gov.br
// @require      https://unpkg.com/vue@3/dist/vue.global.js
// @require      https://unpkg.com/pizzip@3.1.3/dist/pizzip.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/docxtemplater/3.32.4/docxtemplater.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.js
// @require      https://unpkg.com/pizzip@3.1.3/dist/pizzip-utils.js
// @require      https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4
// @grant        unsafeWindow
// ==/UserScript==
(async function() {
    'use strict';
    var vueCampos = [];
    const campos = [
        "NÚMERO DE INSCRIÇÃO",
        "DATA DE ABERTURA",
        "NOME EMPRESARIAL",
        "TÍTULO DO ESTABELECIMENTO (NOME DE FANTASIA)",
        "PORTE",
        "CÓDIGO E DESCRIÇÃO DA ATIVIDADE ECONÔMICA PRINCIPAL",
        "CÓDIGO E DESCRIÇÃO DA NATUREZA JURÍDICA",
        "CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS",
        "LOGRADOURO",
        "NÚMERO",
        "COMPLEMENTO",
        "CEP",
        "BAIRRO/DISTRITO",
        "MUNICÍPIO",
        "UF",
        "ENDEREÇO ELETRÔNICO",
        "TELEFONE",
        "ENTE FEDERATIVO RESPONSÁVEL (EFR)",
        "SITUAÇÃO CADASTRAL",
        "DATA DA SITUAÇÃO CADASTRAL",
        "MOTIVO DE SITUAÇÃO CADASTRAL",
        "SITUAÇÃO ESPECIAL",
        "DATA DA SITUAÇÃO ESPECIAL"
    ];
    let tdCont = "",
        temp = "";
    for(const td of document.querySelectorAll("#app td")){
        if(campos.includes(td.innerText.trim().split("\n")[0])){
            tdCont = td.innerText.trim().split("\n");
            tdCont.shift();
            tdCont = tdCont.join("\n");
            vueCampos.push({fixo:true, texto: nomeFix(td.innerText.trim().split("\n")[0]), valor:tdCont,value: ""})
        }
    }

    vueCampos.push({fixo:false, texto: "N_PROTOCOLO", valor: "",value: ""});
    vueCampos.push({fixo:false, texto: "ANO_ATUAL", valor: new Date().getFullYear(),value: ""});
    vueCampos.push({fixo:false, texto: "DATA_HOJE", valor: formatarDataPorExtenso(),value: ""});
    vueCampos.push({fixo:false, texto: "DESPACHO", valor: [
        "OPÇÕES",
        "Empreendimento PASSÍVEL de licenciamento ambiental. Não foi identificado licenças ambientais emitidas. Necessário o empreendimento entrar com o processo de regularização ambiental. Caso não exerça atividades passíveis de licenciamento ambiental, é recomendado a atualização do cartão CNPJ.",
        "Atividades presentes no CNAE NÃO são passíveis de licenciamento ambiental. Houve atualização do cartão CNPJ.",
        "Empreendimento PASSÍVEL de licenciamento ambiental com Licença de Operação (LO) vigente. Não existem pendências em âmbito de licenciamento ambiental.",
        "Conforme auto de inspeção, apesar de constarem no cartão CNPJ (Cadastro Nacional de Pessoa Jurídica) o empreendimento “NÃO EXERCE atividades passíveis de licenciamento no local”. É recomendado a atualização do cartão CNPJ."
    ], value: ""});

    for (const camp of vueCampos) {
        if (camp.texto === "NUMERO_DE_INSCRIÇAO") {
            camp.valor = camp.valor.replace("\nMATRIZ", "");
        } else if (camp.texto === "CODIGO_E_DESCRIÇAO_DAS_ATIVIDADES_ECONOMICAS_SECUNDARIAS") {
            const linhas = camp.valor
            .split("\n")
            .map(linha => linha.split(" - ")[1] || linha);

            if (linhas.length === 1) {
                camp.valor = `“${linhas[0]}”`;
            } else if (linhas.length === 2) {
                camp.valor = `“${linhas[0]}” e “${linhas[1]}”`;
            } else {
                const ultima = linhas.pop();
                camp.valor = `“${linhas.join("”, “")}” e “${ultima}”`;
            }
        }
        if(typeof camp.valor=="string"){
            camp.value = camp.valor;
        }else{
            camp.value = "OPÇÕES"
        }
    }

    unsafeWindow.PizZip = PizZip;
    unsafeWindow.saveAs = saveAs;
    unsafeWindow.docxtemplater = docxtemplater;

    unsafeWindow.Vue = Vue;
    console.log("Parte 1 - OK");

    function quandoPronto(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback(); // DOM já carregado
        }
    }

    function nomeFix(xProd) {
        const map = [
            [/(á|à|ã|â|ä)/gi, "a"],
            [/(é|è|ê|ë)/gi, "e"],
            [/(í|ì|î|ï)/gi, "i"],
            [/(ó|ò|õ|ô|ö)/gi, "o"],
            [/(ú|ù|û|ü)/gi, "u"],
            [/(ñ)/gi, "n"],
            [/\\|\/|,/g, "_"], // substitui "\", "/" e "," por "_"
        ];

        for (const [regex, replacement] of map) {
            xProd = xProd.replace(regex, replacement);
        }

        xProd = xProd.toUpperCase().trim();
        xProd = xProd.replace(/\s+/g, "_"); // substitui espaços por "_"
        return xProd;
    }

    function formatarDataPorExtenso(data=new Date()) {
        return new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(data);
    }

    quandoPronto(()=>{
        if (document.title.trim().includes("Comprovante") || document.title.trim() === 'Consulta Quadro de Sócios e Administradores - QSA') {
            const app = document.querySelector('#app');
            if (app) {
                const div = document.createElement('div');
                div.id = 'tampermonkey';
                div.textContent = 'Essa div foi adicionada pelo Tampermonkey';
                app.insertBefore(div, app.firstElementChild);


                // Monte Vue após pequeno delay
                setTimeout(() => {
                    unsafeWindow.Tampermonkey = unsafeWindow.Vue.createApp({
                        setup(){
                            return {
                                campos: unsafeWindow.Vue.ref(JSON.parse(JSON.stringify(vueCampos))),
                                camposExtras: unsafeWindow.Vue.ref([]),
                                tab: unsafeWindow.Vue.ref('formulario'),
                                docx: "OPÇÕES",
                                listDocx: unsafeWindow.Vue.ref([])
                            }
                        },
                        computed:{
                            fileSelect:()=>{
                                return document.getElementById("docx").files.length>0;
                            }
                        },
                        async mounted(){
                            this.updateDocxView();
                            if(localStorage.getItem("Extras")!=null){
                                let extras = JSON.parse(localStorage.getItem("Extras"));
                                for(const extra of extras){
                                    this.camposExtras.push({fixo:false, texto: extra.texto, valor: extra.valor.includes(";;") ? extra.valor.split(";;") : extra.valor, value: ""});
                                }
                            }
                        },
                        methods:{
                            async processar(){
                                let structFinal = {};
                                for(const campo of this.campos){
                                    structFinal[campo.texto] = campo.value;
                                }
                                //const input = document.getElementById("docx");
                                const reader = new FileReader();

                                const content = await this.getDocxs(this.docx);
                                const zip = new PizZip(content);
                                const doc = new unsafeWindow.docxtemplater().loadZip(zip);

                                doc.setData(structFinal);

                                try {
                                    doc.render();
                                    const out = doc.getZip().generate({ type: "blob" });
                                    saveAs(out, `${structFinal['NUMERO_DE_INSCRIÇAO'].split(".").join("").split("/").join("").split("-").join("")}.docx`);
                                } catch (error) {
                                    console.error("Erro ao gerar o documento:", error);
                                }
                            },
                            async updateDocxView(){
                                for(let cont=0, contT = this.listDocx.length;cont<contT;cont++){
                                    this.listDocx.shift()
                                }

                                let docxTemp = await this.listDocxDB()
                                for(const el of docxTemp){
                                    this.listDocx.push(el)
                                }

                            },
                            listDocxDB() {
                                return new Promise((resolve, reject) => {
                                    const request = indexedDB.open('DocxStorageDB', 2);

                                    request.onupgradeneeded = (e) => {
                                        const db = e.target.result;

                                        // Check if store already exists before creating
                                        if (!db.objectStoreNames.contains('files')) {
                                            db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                                        }
                                    };

                                    request.onsuccess = (e) => {
                                        const db = e.target.result;
                                        const transaction = db.transaction(['files'], 'readonly');
                                        const store = transaction.objectStore('files');

                                        const files = [];
                                        const cursorRequest = store.openCursor();

                                        cursorRequest.onsuccess = (event) => {
                                            const cursor = event.target.result;
                                            if (cursor) {
                                                const fileData = cursor.value;
                                                files.push(fileData.name); // agora pega o nome do arquivo salvo
                                                cursor.continue();
                                            } else {
                                                resolve(files);
                                            }
                                        };

                                        cursorRequest.onerror = reject;
                                    };

                                    request.onerror = reject;
                                });
                            },

                            addDocx(event) {
                                return new Promise((resolve, reject) => {
                                    const file = event.target.files[0];
                                    const request = indexedDB.open('DocxStorageDB', 2);

                                    request.onupgradeneeded = function (e) {
                                        const db = e.target.result;
                                        if (!db.objectStoreNames.contains('files')) {
                                            db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
                                        }
                                    };

                                    request.onsuccess = (e) => {
                                        const db = e.target.result;

                                        const reader = new FileReader();

                                        reader.onload = (fileEvent) => {
                                            const transaction = db.transaction(['files'], 'readwrite');
                                            const store = transaction.objectStore('files');

                                            let isUpdate = false;
                                            let existingId = null;

                                            // Procurar se já existe um arquivo com o mesmo nome
                                            const cursorRequest = store.openCursor();

                                            cursorRequest.onsuccess = (event) => {
                                                const cursor = event.target.result;
                                                if (cursor) {
                                                    if (cursor.value.name === file.name) {
                                                        isUpdate = true;
                                                        existingId = cursor.value.id;
                                                    }
                                                    cursor.continue();
                                                } else {
                                                    const fileData = {
                                                        name: file.name,
                                                        content: fileEvent.target.result
                                                    };

                                                    if (isUpdate) {
                                                        fileData.id = existingId; // sobrescreve
                                                    }

                                                    store.put(fileData);

                                                    transaction.oncomplete = () => {
                                                        if (isUpdate) {
                                                            resolve(`Arquivo "${file.name}" substituído com sucesso.`);
                                                        } else {
                                                            resolve(`Arquivo "${file.name}" salvo com sucesso.`);
                                                        }
                                                        if (typeof this.updateDocxView === 'function') {
                                                            this.updateDocxView();
                                                        }
                                                    };

                                                    transaction.onerror = () => {
                                                        if (typeof this.updateDocxView === 'function') {
                                                            this.updateDocxView();
                                                        }
                                                        reject('Erro ao salvar o arquivo no IndexedDB.');
                                                    };
                                                }
                                            };

                                            cursorRequest.onerror = reject;
                                        };

                                        reader.onerror = reject;
                                        reader.readAsArrayBuffer(file);
                                    };

                                    request.onerror = reject;
                                });
                            },
                            getDocxs(fileName) {
                                return new Promise((resolve, reject) => {
                                    const request = indexedDB.open('DocxStorageDB', 2);

                                    request.onsuccess = (e) => {
                                        const db = e.target.result;
                                        const transaction = db.transaction(['files'], 'readonly');
                                        const store = transaction.objectStore('files');

                                        const cursorRequest = store.openCursor();
                                        cursorRequest.onsuccess = (event) => {
                                            const cursor = event.target.result;
                                            if (cursor) {
                                                if (cursor.value.name === fileName) {
                                                    resolve(cursor.value.content); // Retorna o ArrayBuffer
                                                    return;
                                                }
                                                cursor.continue();
                                            } else {
                                                resolve(null); // Não encontrado
                                            }
                                        };

                                        cursorRequest.onerror = reject;
                                    };

                                    request.onerror = reject;
                                });
                            },
                            delDocx(fileName) {
                                return new Promise((resolve, reject) => {
                                    const request = indexedDB.open('DocxStorageDB', 2);

                                    request.onsuccess = (e) => {
                                        const db = e.target.result;
                                        const transaction = db.transaction(['files'], 'readwrite');
                                        const store = transaction.objectStore('files');

                                        const cursorRequest = store.openCursor();
                                        cursorRequest.onsuccess = (event) => {
                                            const cursor = event.target.result;
                                            if (cursor) {
                                                if (cursor.value.name === fileName) {
                                                    const deleteRequest = store.delete(cursor.key);
                                                    deleteRequest.onsuccess = () => {
                                                        if (typeof this.updateDocxView === 'function') {
                                                            this.updateDocxView();
                                                        }
                                                        resolve(`Arquivo "${fileName}" deletado com sucesso.`);
                                                    };
                                                    deleteRequest.onerror = () => {
                                                        if (typeof this.updateDocxView === 'function') {
                                                            this.updateDocxView();
                                                        }
                                                        reject(`Erro ao deletar o arquivo "${fileName}".`);
                                                    };
                                                    return;
                                                }
                                                cursor.continue();
                                            } else {
                                                resolve(`Arquivo "${fileName}" não encontrado.`);
                                            }
                                        };

                                        cursorRequest.onerror = reject;
                                    };

                                    request.onerror = reject;
                                });
                            }
                        },
                        template: `
<div class="bg-white border border-gray-300 rounded-lg shadow !m-[10vh]">
  <div class="bg-gray-200">
    <ul class="flex -mb-px text-sm font-medium text-center">
      <li @click="tab = 'formulario'" class="grow px-1 pt-2" role="presentation">
        <button
          :class="(tab == 'formulario' ? 'bg-white' : '') + ' w-full p-2 inline-block !rounded-t-lg hover:text-blue-700 hover:border-gray-300'">Formulario</button>
      </li>
      <li @click="tab = 'extras'" class="grow px-1 pt-2" role="presentation">
        <button
          :class="(tab == 'extras' ? 'bg-white' : '') + ' w-full  p-2 inline-block !rounded-t-lg hover:text-blue-700 hover:border-gray-300'">Extras</button>
      </li>
      <li @click="tab = 'docx'" class="grow px-1 pt-2" role="presentation">
        <button
          :class="(tab == 'docx' ? 'bg-white' : '') + ' w-full  p-2 inline-block !rounded-t-lg hover:text-blue-700 hover:border-gray-300'">Docx's</button>
      </li>
    </ul>
  </div>
  <div v-if="tab=='extras'" class="p-2 flex flex-wrap">
      <template v-for="campo in campos">
      <div v-if="!campos.fixo" class="relative p-1 mb-1 w-4/12" title="">
        <input type="text" v-model="campo.value"
          class="h-[40px] p-2.5 disabled:cursor-not-allowed disabled:bg-gray-300 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full">
        <label
          class="line-clamp-1 me-4 ms-1 rounded-lg absolute left-2 -top-1 px-1 text-sm text-gray-700 bg-gray-50 text-[10px]">{{campo.texto}}</label>
      </div>
    </template>
  </div>
  <div v-if="tab=='formulario'" class="p-2 flex flex-wrap">
    <template v-for="campo in campos">
      <div v-if="typeof campo.valor == 'string'" class="relative p-1 mb-1 w-4/12" title="">
        <input type="text" v-model="campo.value"
          class="h-[40px] p-2.5 disabled:cursor-not-allowed disabled:bg-gray-300 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full">
        <label
          class="line-clamp-1 me-4 ms-1 rounded-lg absolute left-2 -top-1 px-1 text-sm text-gray-700 bg-gray-50 text-[10px]">{{campo.texto}}</label>
      </div>
      <div v-if="typeof campo.valor == 'object'" class="relative p-1 mb-1 w-4/12" title="">
        <select v-model="campo.value"
          class="h-[40px] p-2.5 disabled:cursor-not-allowed disabled:bg-gray-300 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full">
          <option v-for="opc in campo.valor" :value="opc">{{opc}}</option>
        </select>
        <label
          class="line-clamp-1 me-4 ms-1 rounded-lg absolute left-2 -top-1 px-1 text-sm text-gray-700 bg-gray-50 text-[10px]">{{campo.texto}}</label>
      </div>
    </template>
    <div class="w-full flex flex-wrap">
      <div class="px-2 w-6/12">
        <div class="relative p-1 mb-1 w-full" title="">
        <select v-model="docx"
          class="h-[40px] p-2.5 disabled:cursor-not-allowed disabled:bg-gray-300 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full">
          <option value="OPÇÕES">OPÇÕES</option>
          <option v-for="file in listDocx" :value="file">{{file}}</option>
        </select>
        <label
          class="line-clamp-1 me-4 ms-1 rounded-lg absolute left-2 -top-1 px-1 text-sm text-gray-700 bg-gray-50 text-[10px]">Template Docx</label>
      </div>
      </div>
      <div class="px-2 w-6/12">
        <button @click="processar"
          class="h-[40px] p-1 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none disabled:cursor-not-allowed disabled:!bg-blue-800 w-full">GERAR</button>
      </div>
    </div>
  </div>
  <div v-if="tab=='docx'"
    class="p-2 justify-center flex flex-wrap">
    <!-- Lista de arquivos -->
    <ul id="docx-list" class="space-y-2 w-full">
      <!-- Exemplo de item -->
      <li v-for="docx in listDocx" class="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-xl my-1">
        <span class="text-sm text-gray-700 truncate">{{docx}}</span>
        <div class="flex gap-2">
          <a href="#" download class="text-blue-600 hover:text-blue-800 transition" title="Download">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2m-6-4l-4-4m0 0l4-4m-4 4h12" />
            </svg>
          </a>
          <button @click="delDocx(docx)" class="text-red-600 hover:text-red-800 transition" title="Deletar">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
    <label for="upload-docx"
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow cursor-pointer hover:bg-blue-700 transition duration-200">Adicionar Documento <input @change="addDocx" id="upload-docx" type="file" accept=".docx" class="hidden" />
    </label>
  </div>
</div>
`
                    }).mount('#tampermonkey');
                }, 1000);
            } else {
                console.warn('#app não encontrado');
            }
        }
    });
})();

function loadFile(url, callback) {
    PizZipUtils.getBinaryContent(url, callback);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
