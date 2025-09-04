# Envio de E-mails Node.js + TypeScript

Projeto para enviar e-mails personalizados usando CSV e template HTML. Imagens do e-mail são incorporadas via CID, garantindo que apareçam no corpo da mensagem.

## Funcionalidades
- Ler contatos de `emails.csv`
- Substituir placeholders no HTML (`{{nome}}`, `{{percdesc}}`, `{{mesquevem}}`)
- Enviar e-mails via Gmail com Nodemailer
- Incorporar imagens usando CID
- Variáveis sensíveis em `.env`


