import * as fs from "fs";
import { parse } from "csv-parse";
import nodemailer from "nodemailer";
import 'dotenv/config';
import DataUtil from "./DataUtil"; // Certifique-se que DataUtil tem mesExtenso()

'use strict';

// Função para ler CSV
async function lerArq(caminhoArquivo: string, delimiter: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const registros: any[] = [];

        const leitor = fs.createReadStream(caminhoArquivo)
            .pipe(parse({
                columns: (header: string[]) => header.map(h => h.trim()), // Remove espaços extras nos headers
                skip_empty_lines: true,
                delimiter: delimiter,
            }));

        leitor.on('data', (linha: any) => {
            const linhaTrim = Object.fromEntries(
                Object.entries(linha).map(([key, value]) => [key, value?.toString().trim()])
            );
            registros.push(linhaTrim);
        });

        leitor.on('end', () => {
            resolve(registros);
        });

        leitor.on('error', (erro: any) => {
            reject(erro);
        });
    });
}

// Função para calcular idade
function idade(nasc: any): number {
    const hoje = new Date();
    let datan: any;

    if (typeof nasc === "string") {
        const ano: number = parseInt(nasc.substring(6, 10));
        const mes: number = parseInt(nasc.substring(3, 5)) - 1;
        const dia: number = parseInt(nasc.substring(0, 2));
        datan = new Date(ano, mes, dia);
    } else {
        datan = nasc;
    }

    let idade: number = hoje.getFullYear() - datan.getFullYear();
    const m: number = hoje.getMonth() - datan.getMonth();

    if (m < 0 || (m === 0 && hoje.getDate() < datan.getDate())) {
        idade--;
    }

    return idade;
}

// Função para enviar email com CID
async function enviarEmail(destinatario: string, email: string, assunto: string, corpo: string) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    // Attachments para as imagens com CID
    const attachments = [
        { filename: 'logo.png', path: './src/imagens/logo.png', cid: 'logo' },
        { filename: 'assinatura.png', path: './src/imagens/assinatura.png', cid: 'assinatura' }
    ];

    // Substituir as tags <img> no HTML para usar o CID
    corpo = corpo.replace('<img width=467 height=111 src="imagens/logo.png">', '<img width=467 height=111 src="cid:logo">');
    corpo = corpo.replace('<img border=0 width=627 height=121 src="imagens/assinatura.png">', '<img border=0 width=627 height=121 src="cid:assinatura">');

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: assunto,
        html: corpo,
        attachments: attachments
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email enviado para ${destinatario} (${email})`);
    } catch (error: any) {
        console.error(`❌ Erro ao enviar email para ${destinatario} (${email}):`, error.message);
    }
}

// Função principal
async function main() {
    const caminhoCSV = './src/emails.csv';
    const caminhoHTML = './src/Mensagem.html';
    let html: string;
    let linhasHTML: string[];

    try {
        html = fs.readFileSync(caminhoHTML, 'utf-8');
        linhasHTML = html.split('\n');
    } catch (error) {
        console.error('Erro ao ler HTML:', error);
        return;
    }

    try {
        const contatos = await lerArq(caminhoCSV, ';');
        console.log(`Contatos carregados: ${contatos.length}`);

        for (const dados of contatos) {
            console.log("Enviando para:", dados);

            let htmlemail = "";
            for (const linha of linhasHTML) {
                if (linha.includes('{{nome}}')) {
                    htmlemail += linha.replace('{{nome}}', dados.Nome) + '\n';
                } else if (linha.includes('{{percdesc}}')) {
                    htmlemail += linha.replace('{{percdesc}}', idade(dados.Nasc).toString()) + '\n';
                } else if (linha.includes('{{mesquevem}}')) {
                    const hoje = new Date();
                    htmlemail += linha.replace('{{mesquevem}}', "(" + DataUtil.mesExtenso(hoje.getMonth() + 2) + "/" + hoje.getFullYear() + ").\n");
                } else {
                    htmlemail += linha + '\n';
                }
            }

            await enviarEmail(dados.Nome, dados.Email, "Oferta especial para você", htmlemail);
        }

    } catch (erro) {
        console.error('Erro ao processar CSV:', erro);
    }
}

// Executa o script
main().catch(err => {
    console.error('Erro geral:', err.message);
    process.exit(1);
});
