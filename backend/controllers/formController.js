const fs = require("fs");
const path = require("path");

// Chemin vers le fichier contenant les formulaires et les paramètres
const formsData = path.join(__dirname, "../forms.json");
const fieldsDirectory = path.join(__dirname, "../fields");

// Fonction utilitaire pour enrichir un formulaire avec sa description et son tag
const enrichForm = (form) => {
  if (!form) return form;
  let desc = form.description || "";
  if (!desc && form.fields) {
    try {
      const fieldsPath = path.join(fieldsDirectory, form.fields);
      if (fs.existsSync(fieldsPath)) {
        const fieldsData = JSON.parse(fs.readFileSync(fieldsPath, "utf8"));
        desc = fieldsData.description || "";
      }
    } catch (e) {
      // ignorer
    }
  }
  return {
    ...form,
    description: desc,
    tag: form.tag || "",
  };
};

// Méthode pour obtenir la liste des formulaires
exports.getForms = (req, res) => {
	fs.readFile(formsData, "utf8", (err, data) => {
		if (err) return res.status(404).send("Form not found");
		try {
			const forms = JSON.parse(data);
			const enrichedForms = forms.map(enrichForm);
			res.json(enrichedForms);
		} catch (e) {
			res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};

// Méthode pour obtenir un formulaire spécifique
exports.getFormByName = (req, res) => {
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

			res.json(enrichForm(formDetails));
		} catch (err) {
			return res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};

// Méthode pour obtenir le nom d'un formulaire à partir de son field et param
exports.getFormByFieldsAndParam = (req, res) => {
  const fieldsName = req.params.fieldsName;
  const paramName = req.params.paramName;

	fs.readFile(formsData, "utf8", (err, data) => {
		if (err)
			return res.status(500).send("Erreur lors de la lecture du fichier de formulaires");

		try {
			const formData = JSON.parse(data);
			const formDetails = formData.find((form) => form.fields === fieldsName && form.param === paramName);

			if (!formDetails) {
				return res.status(404).send(`Formulaire (${fieldsName} ${paramName}) non trouvé`);
			}

			res.json(enrichForm(formDetails));
		} catch (err) {
			return res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};

// Méthode pour obtenir le nom d'un formulaire à partir de son id
exports.getFormByID = (req, res) => {
  const formID = req.params.formID;

	fs.readFile(formsData, "utf8", (err, data) => {
		if (err)
			return res.status(500).send("Erreur lors de la lecture du fichier de formulaires");

		try {
			const formData = JSON.parse(data);
			const formDetails = formData.find((form) => String(form.id) === String(formID));

			if (!formDetails) {
				return res.status(404).send(`Formulaire ${formID} non trouvé`);
			}

			res.json(enrichForm(formDetails));
		} catch (err) {
			return res.status(500).send("Erreur lors de l'analyse des données");
		}
	});
};

// Méthode pour créer un nouveau formulaire (fields + enregistrement dans forms.json)
exports.createForm = (req, res) => {
  const { name, description, fileName, paramFile, fields, tag } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Le nom du formulaire est obligatoire" });
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ message: "Le formulaire doit contenir au moins un champ" });
  }

  // Nettoyer et formater le nom de fichier
  const rawBase = (fileName || name)
    .trim()
    .replace(/\.json$/i, "");

  let targetFileName = `${rawBase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")}.json`;

  const fieldsFilePath = path.join(fieldsDirectory, targetFileName);

  // Structure du fichier dans backend/fields/
  const fieldsContent = {
    title: name.trim(),
    description: (description || "").trim(),
    fields: fields.map((field) => {
      const cleaned = {
        label: field.label || "Sans titre",
        sublabel: field.sublabel || "",
        type: field.type || "text",
        required: Boolean(field.required),
      };

      if (field.type === "range") {
        cleaned.min = field.min !== undefined ? Number(field.min) : 0;
        cleaned.max = field.max !== undefined ? Number(field.max) : 100;
        cleaned.step = field.step !== undefined ? Number(field.step) : 1;
        cleaned.labelMin = field.labelMin || "";
        cleaned.labelMax = field.labelMax || "";
      } else if (field.type === "choice" || field.type === "drop-down" || field.type === "ranking") {
        cleaned.options = Array.isArray(field.options) ? field.options.filter(Boolean) : [];
        if (field.type === "choice") {
          cleaned.otherChoice = Boolean(field.otherChoice);
        }
      } else if (field.type === "textAutosize") {
        cleaned.minRows = field.minRows ? Number(field.minRows) : 3;
      }

      if (field.placeholder) {
        cleaned.placeholder = field.placeholder;
      }

      return cleaned;
    }),
  };

  try {
    if (!fs.existsSync(fieldsDirectory)) {
      fs.mkdirSync(fieldsDirectory, { recursive: true });
    }

    // 1. Écrire le fichier dans backend/fields/
    fs.writeFileSync(fieldsFilePath, JSON.stringify(fieldsContent, null, 2), "utf8");

    // 2. Mettre à jour forms.json
    let forms = [];
    if (fs.existsSync(formsData)) {
      try {
        forms = JSON.parse(fs.readFileSync(formsData, "utf8") || "[]");
      } catch (e) {
        forms = [];
      }
    }

    // Calcul du nouvel ID unique
    const newId =
      forms.length > 0
        ? Math.max(...forms.map((f) => (Number(f.id) !== undefined && !isNaN(Number(f.id)) ? Number(f.id) : 0))) + 1
        : 0;

    const newFormEntry = {
      name: name.trim(),
      fields: targetFileName,
      param: paramFile || "UserID_Block.json",
      id: newId,
      tag: (tag || "").trim(),
      description: (description || "").trim(),
    };

    // Vérifier si un formulaire avec le même fichier fields existe déjà pour le mettre à jour
    const existingIndex = forms.findIndex((f) => f.fields === targetFileName);
    if (existingIndex !== -1) {
      newFormEntry.id = forms[existingIndex].id;
      forms[existingIndex] = newFormEntry;
    } else {
      forms.push(newFormEntry);
    }

    fs.writeFileSync(formsData, JSON.stringify(forms, null, 4), "utf8");

    res.status(201).json({
      message: "Formulaire créé avec succès",
      form: newFormEntry,
    });
  } catch (error) {
    console.error("Erreur lors de la création du formulaire :", error);
    res.status(500).json({ message: "Erreur lors de la sauvegarde du formulaire" });
  }
};

// Méthode pour mettre à jour un formulaire existant
exports.updateForm = (req, res) => {
  const formID = req.params.formID;
  const { name, description, paramFile, fields, tag } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Le nom du formulaire est obligatoire" });
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return res.status(400).json({ message: "Le formulaire doit contenir au moins un champ" });
  }

  try {
    if (!fs.existsSync(formsData)) {
      return res.status(404).json({ message: "Fichier forms.json introuvable" });
    }

    const forms = JSON.parse(fs.readFileSync(formsData, "utf8") || "[]");
    const formIndex = forms.findIndex((f) => String(f.id) === String(formID));

    if (formIndex === -1) {
      return res.status(404).json({ message: `Formulaire avec l'identifiant ${formID} introuvable` });
    }

    const currentForm = forms[formIndex];
    const fieldsFileName = currentForm.fields;
    const fieldsFilePath = path.join(fieldsDirectory, fieldsFileName);

    // Formatter les champs
    const fieldsContent = {
      title: name.trim(),
      description: (description || "").trim(),
      fields: fields.map((field) => {
        const cleaned = {
          label: field.label || "Sans titre",
          sublabel: field.sublabel || "",
          type: field.type || "text",
          required: Boolean(field.required),
        };

        if (field.type === "range") {
          cleaned.min = field.min !== undefined ? Number(field.min) : 0;
          cleaned.max = field.max !== undefined ? Number(field.max) : 100;
          cleaned.step = field.step !== undefined ? Number(field.step) : 1;
          cleaned.labelMin = field.labelMin || "";
          cleaned.labelMax = field.labelMax || "";
        } else if (field.type === "choice" || field.type === "drop-down" || field.type === "ranking") {
          cleaned.options = Array.isArray(field.options) ? field.options.filter(Boolean) : [];
          if (field.type === "choice") {
            cleaned.otherChoice = Boolean(field.otherChoice);
          }
        } else if (field.type === "textAutosize") {
          cleaned.minRows = field.minRows ? Number(field.minRows) : 3;
        }

        if (field.placeholder) {
          cleaned.placeholder = field.placeholder;
        }

        return cleaned;
      }),
    };

    // Écrire les champs mis à jour dans backend/fields/
    fs.writeFileSync(fieldsFilePath, JSON.stringify(fieldsContent, null, 2), "utf8");

    // Mettre à jour forms.json
    currentForm.name = name.trim();
    if (tag !== undefined) {
      currentForm.tag = (tag || "").trim();
    }
    if (description !== undefined) {
      currentForm.description = (description || "").trim();
    }
    if (paramFile) {
      currentForm.param = paramFile;
    }
    forms[formIndex] = currentForm;

    fs.writeFileSync(formsData, JSON.stringify(forms, null, 4), "utf8");

    res.json({
      message: "Formulaire mis à jour avec succès",
      form: currentForm,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du formulaire :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du formulaire" });
  }
};

// Méthode pour supprimer un formulaire
exports.deleteForm = (req, res) => {
  const formID = req.params.formID;

  try {
    if (!fs.existsSync(formsData)) {
      return res.status(404).json({ message: "Fichier forms.json introuvable" });
    }

    const forms = JSON.parse(fs.readFileSync(formsData, "utf8") || "[]");
    const formToDelete = forms.find((f) => String(f.id) === String(formID));

    if (!formToDelete) {
      return res.status(404).json({ message: `Formulaire avec l'identifiant ${formID} non trouvé` });
    }

    // Filtrer pour retirer le formulaire
    const updatedForms = forms.filter((f) => String(f.id) !== String(formID));
    fs.writeFileSync(formsData, JSON.stringify(updatedForms, null, 4), "utf8");

    // Vérifier si un autre formulaire utilise encore ce même fichier fields
    const stillUsed = updatedForms.some((f) => f.fields === formToDelete.fields);
    if (!stillUsed && formToDelete.fields) {
      const filePath = path.join(fieldsDirectory, formToDelete.fields);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn(`Impossible de supprimer le fichier fields ${formToDelete.fields}:`, unlinkErr);
        }
      }
    }

    res.json({
      message: "Formulaire supprimé avec succès",
      deletedId: formID,
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du formulaire :", error);
    res.status(500).json({ message: "Erreur lors de la suppression du formulaire" });
  }
};

