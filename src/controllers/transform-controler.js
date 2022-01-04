const { json } = require('body-parser');
const { use } = require('chai');
const mondayService = require('../services/monday-service');

async function atualizacao(req, res) {

    const { shortLivedToken } = req.session;
    const { payload } = req.body;

    try {
        const { inputFields } = payload;
        const { itemId } = inputFields;
        
        const findValue = await mondayService.pegarValor(shortLivedToken, itemId);

        let person = findValue.column_values.find(x => x.title === "Pessoa");
        let datas = findValue.column_values.find(x => x.title === "Data");
        let horas = findValue.column_values.find(x => x.title === "Horas");

        let boardDiario = findValue.column_values.find(x => x.title === "Horas Diárias");

        const personValue = JSON.parse(person.value);
        const personID = personValue.personsAndTeams[0].id

        let hora = parseFloat(horas.text);
        const data = datas.text.substring(0, 10);

        const items = await mondayService.getItemsBoardColumnValues(shortLivedToken, boardDiario.text, { column_id: person.id, column_value: person.text });

        if(items.length<=0){
            let vars = {
                nomeItem: `${person.text} - ${data}`,
                columnVals: JSON.stringify({
                    person: personValue,
                    data: data,
                    n_meros: hora,
                })
            }

         await mondayService.changeColumnValueTime(shortLivedToken, boardDiario.text, vars);
        }

        for (let i = 0; i < items.length; i++) {

            let itemsPerson = items[i].column_values.find(x => x.title === "Pessoa");
            let itemsData = items[i].column_values.find(x => x.title === "Data");
            let itemsHora = items[i].column_values.find(x => x.title === "Horas");

            let itemPersonJSON = JSON.parse(itemsPerson.value);

            let itemPersonID = itemPersonJSON.personsAndTeams[0].id
            const itemHora = itemsHora.text
            const itemData = itemsData.text.substring(0, 10);

            if (personID == itemPersonID && data == itemData) {
                if (items[i].id == itemId) {
                    continue;
                } else {
                    hora = parseFloat(itemHora) + parseFloat(hora);
                }
            }
        }

        if (hora === null || Number.isNaN(parseFloat(hora))) {
            throw new Error('Não registraremos essa linha');
        }

        let vars = {
            nomeItem: `${person.text} - ${data}`,
            columnVals: JSON.stringify({
                person: personValue,
                data: data,
                n_meros: hora,
            })
        }

        const fill = await mondayService.getItemsBoardColumnValues(shortLivedToken, boardDiario.text, { column_id: "name", column_value: vars.nomeItem }, JSON.stringify(["person", "data"]));

        if (fill.length == 0) {
            console.log("Data diferente");
            await mondayService.changeColumnValueTime(shortLivedToken, boardDiario.text, vars);
        } else if (fill.length > 1) {
            console.log("Mais de um");
            for (let i = 1; i < fill.length; i++) {
                const delItem = mondayService.deleteItemFromId(shortLivedToken, fill[i].id);
                console.log("Item excluído", delItem);
            }
            await mondayService.setItemsValues(shortLivedToken, boardDiario.text, JSON.stringify(`{\"n_meros\": ${hora}}`), fill[0].id);
        } else {
            console.log("Mesma data");
            await mondayService.setItemsValues(shortLivedToken, boardDiario.text, JSON.stringify(`{\"n_meros\": ${hora}}`), fill[0].id);
        }

        return res.status(200).send({ message: "sucesso" })
    } catch (err) {
        console.error(err);
        return res.status(404).send({ message: 'Erro na controler' });
    }
}
module.exports = {
    atualizacao,
};
