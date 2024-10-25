const fs = require("fs");
const path = require("path");

// Chemin vers le fichier contenant les formulaires et les paramètres
const formsData = path.join(__dirname, "../forms.json");

// Méthode pour obtenir la liste des formulaires
exports.getForms = (req, res) => {
	fs.readFile(formsData, "utf8", (err, data) => {
		if (err) return res.status(404).send("Form not found");
		res.json(JSON.parse(data));
	});
};

// Méthode pour obtenir un formulaire spécifique
exports.getFormsDetails = (req, res) => {
	const formName = req.params.formName;

	fs.readFile(formsData, "utf8", (err, data) => {
		if (err)
			return res
				.status(500)
				.send("Erreur lors de la lecture du fichier de formulaires");

		try {
			const formData = JSON.parse(data);
			const formDetails = formData.find((form) => form.name === formName);

			if (!formDetails) {
				return res.status(404).send(`Formulaire ${formName} non trouvé`);
			}

			res.json(formDetails);
		} catch (err) {
			return res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};

// Méthode pour obtenir le nom d'un formulaire à partir de son field et param
exports.getFormName = (req, res) => {
  const fieldsName = req.params.fieldsName;
  const paramName = req.params.paramName;
  // return res.status(404).send(`Formulaire (${fieldsName} ${paramName}) non trouvé`);


	fs.readFile(formsData, "utf8", (err, data) => {
		if (err)
			return res.status(500).send("Erreur lors de la lecture du fichier de formulaires");

		try {
			const formData = JSON.parse(data);
			const formDetails = formData.find((form) => form.fields === fieldsName & form.param === paramName);

			if (!formDetails) {
				return res.status(404).send(`Formulaire (${fieldsName} ${paramName}) non trouvé`);
			}

			res.json(formDetails);
		} catch (err) {
			return res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};
