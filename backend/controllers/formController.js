const fs = require("fs");
const path = require("path");
const { readJson, writeJson, listJsonFiles } = require("../services/fileService");
const { isValidFormID, readAnswers, writeAnswers } = require("../services/answersService");

// Chemin vers le fichier contenant les formulaires et les paramètres
const formsData = path.join(__dirname, "../forms.json");
const fieldsDirectory = path.join(__dirname, "../fields");
const answersDirectory = path.join(__dirname, "../answers");

const readForms = () => {
  const forms = readJson(formsData, []);
  return Array.isArray(forms) ? forms : [];
};

const writeForms = (forms) => writeJson(formsData, forms, 4);

// Fonction utilitaire pour enrichir un formulaire avec sa description et son tag
const enrichForm = (form) => {
  if (!form) return form;
  let desc = form.description || "";
  if (!desc && form.fields) {
    try {
      const fieldsContent = readJson(path.join(fieldsDirectory, path.basename(form.fields)), null);
      desc = fieldsContent?.description || "";
    } catch (e) {
      // Fichier de questions illisible : on garde une description vide
    }
  }
  return {
    ...form,
    description: desc,
    tag: form.tag || "",
    timing: form.timing || (form.param === 'UserID_Block.json' ? 'pre' : 'post-modality'),
  };
};

// Fichier de paramètres associé par défaut à chaque jalon expérimental
const paramFileForTiming = (timing) => {
  if (timing === 'pre' || timing === 'post') return 'UserID_Block.json';
  if (timing === 'post-modality') return 'UserID_TI_Block.json';
  if (timing === 'trial') return 'Active_Protocol.json';
  if (timing === 'free') return '';
  return undefined;
};

// Nettoie la définition d'une question avant de l'écrire dans backend/fields/
const cleanField = (field = {}) => {
  const type = field.type || "text";
  const cleaned = {
    label: field.label || "Sans titre",
    sublabel: field.sublabel || "",
    type,
    required: Boolean(field.required),
  };

  if (type === "range") {
    const toNumber = (value, fallback) => {
      const n = Number(value);
      return value === undefined || value === null || value === "" || Number.isNaN(n) ? fallback : n;
    };
    cleaned.min = toNumber(field.min, 0);
    cleaned.max = toNumber(field.max, 100);
    cleaned.step = toNumber(field.step, 1) > 0 ? toNumber(field.step, 1) : 1;
    cleaned.labelMin = field.labelMin || "";
    cleaned.labelMax = field.labelMax || "";
  } else if (type === "choice" || type === "drop-down" || type === "ranking") {
    const options = Array.isArray(field.options)
      ? field.options.map((o) => String(o ?? "").trim()).filter(Boolean)
      : [];
    cleaned.options = [...new Set(options)]; // des options en double casseraient le classement
    if (type === "choice") {
      cleaned.otherChoice = Boolean(field.otherChoice);
    }
  } else if (type === "textAutosize") {
    cleaned.minRows = Number(field.minRows) > 0 ? Number(field.minRows) : 3;
  } else if (type === "image") {
    // Conserver les propriétés d'affichage des images lors d'une modification
    if (field.src) cleaned.src = field.src;
    if (field.size) cleaned.size = field.size;
    if (field.align) cleaned.align = field.align;
  }

  if (field.placeholder) {
    cleaned.placeholder = field.placeholder;
  }

  return cleaned;
};

// Valide le corps d'une requête de création / mise à jour. Retourne un message d'erreur ou null.
const validateFormPayload = ({ name, fields }) => {
  if (!name || !String(name).trim()) {
    return "Le nom du formulaire est obligatoire";
  }
  if (!Array.isArray(fields) || fields.length === 0) {
    return "Le formulaire doit contenir au moins un champ";
  }
  return null;
};

// Envoie le formulaire trouvé par `predicate`, ou une 404
const sendForm = (res, predicate, notFoundMessage) => {
  try {
    const formDetails = readForms().find(predicate);
    if (!formDetails) {
      return res.status(404).send(notFoundMessage);
    }
    res.json(enrichForm(formDetails));
  } catch (err) {
    console.error("Erreur de lecture de forms.json :", err);
    res.status(500).send("Erreur lors de l'analyse des données");
  }
};

// Méthode pour obtenir la liste des formulaires
exports.getForms = (req, res) => {
  try {
    res.json(readForms().map(enrichForm));
  } catch (e) {
    console.error("Erreur de lecture de forms.json :", e);
    res.status(500).send("Erreur lors de l'analyse des données");
  }
};

// Méthode pour obtenir un formulaire à partir de son id
exports.getFormByID = (req, res) => {
  const formID = req.params.formID;
  sendForm(res, (form) => String(form.id) === String(formID), `Formulaire ${formID} non trouvé`);
};

// Méthode pour créer un nouveau formulaire (fields + enregistrement dans forms.json)
exports.createForm = (req, res) => {
  const { name, description, fileName, paramFile, fields, tag } = req.body || {};

  const validationError = validateFormPayload({ name, fields });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  // Nettoyer et formater le nom de fichier
  const rawBase = String(fileName || name)
    .trim()
    .replace(/\.json$/i, "");

  const slug = rawBase
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // Enlever les accents
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");

  if (!slug.replace(/_/g, "")) {
    return res.status(400).json({ message: "Le nom de fichier du formulaire est invalide" });
  }

  const targetFileName = `${slug}.json`;
  const fieldsFilePath = path.join(fieldsDirectory, targetFileName);

  // Structure du fichier dans backend/fields/
  const fieldsContent = {
    title: name.trim(),
    description: (description || "").trim(),
    fields: fields.map(cleanField),
  };

  try {
    const forms = readForms();

    // Calcul du nouvel ID unique. On tient aussi compte des fichiers de réponses
    // existants : réutiliser l'ID d'un formulaire supprimé ferait hériter le
    // nouveau formulaire des anciennes réponses (answers/<id>.json).
    const usedIds = [
      ...forms.map((f) => Number(f.id)),
      ...listJsonFiles(answersDirectory).map((f) => Number(path.basename(f, ".json"))),
    ].filter((n) => Number.isInteger(n) && n >= 0);
    const newId = usedIds.length > 0 ? Math.max(...usedIds) + 1 : 0;

    const resolvedTiming = req.body.timing || 'post-modality';
    let resolvedParam = paramFile;
    if (!resolvedParam || resolvedParam === 'auto') {
      resolvedParam = paramFileForTiming(resolvedTiming) ?? 'UserID_Block.json';
    } else if (resolvedParam === 'none') {
      resolvedParam = '';
    }

    const newFormEntry = {
      name: name.trim(),
      fields: targetFileName,
      param: resolvedParam,
      id: newId,
      tag: (tag || "").trim(),
      timing: resolvedTiming,
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

    // 1. Écrire le fichier dans backend/fields/  2. Mettre à jour forms.json
    writeJson(fieldsFilePath, fieldsContent);
    writeForms(forms);

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
  const { name, description, paramFile, fields, tag, timing } = req.body || {};

  const validationError = validateFormPayload({ name, fields });
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    if (!fs.existsSync(formsData)) {
      return res.status(404).json({ message: "Fichier forms.json introuvable" });
    }

    const forms = readForms();
    const formIndex = forms.findIndex((f) => String(f.id) === String(formID));

    if (formIndex === -1) {
      return res.status(404).json({ message: `Formulaire avec l'identifiant ${formID} introuvable` });
    }

    const currentForm = forms[formIndex];
    const fieldsFilePath = path.join(fieldsDirectory, path.basename(currentForm.fields));

    const fieldsContent = {
      title: name.trim(),
      description: (description || "").trim(),
      fields: fields.map(cleanField),
    };

    // Mettre à jour l'entrée de forms.json
    currentForm.name = name.trim();
    if (tag !== undefined) {
      currentForm.tag = (tag || "").trim();
    }
    if (description !== undefined) {
      currentForm.description = (description || "").trim();
    }
    if (paramFile !== undefined) {
      if (paramFile === 'auto') {
        currentForm.param = paramFileForTiming(timing || currentForm.timing) ?? 'UserID_Block.json';
      } else if (paramFile === 'none') {
        currentForm.param = '';
      } else {
        currentForm.param = paramFile;
      }
    } else if (timing !== undefined) {
      const timingParam = paramFileForTiming(timing);
      if (timingParam !== undefined) currentForm.param = timingParam;
    }
    if (timing !== undefined) {
      currentForm.timing = timing;
    }
    forms[formIndex] = currentForm;

    // Écrire les champs mis à jour dans backend/fields/ puis forms.json
    writeJson(fieldsFilePath, fieldsContent);
    writeForms(forms);

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

    const forms = readForms();
    const formToDelete = forms.find((f) => String(f.id) === String(formID));

    if (!formToDelete) {
      return res.status(404).json({ message: `Formulaire avec l'identifiant ${formID} non trouvé` });
    }

    // Les réponses déjà collectées sont conservées. Elles sont lues AVANT la suppression
    // (avec le nom et les fichiers du questionnaire) puis réécrites APRÈS : ces informations,
    // qui ne peuvent plus être déduites de forms.json, restent ainsi dans le fichier de réponses.
    const collectedAnswers = isValidFormID(formID) ? readAnswers(formID) : [];

    // Filtrer pour retirer le formulaire
    const updatedForms = forms.filter((f) => String(f.id) !== String(formID));
    writeForms(updatedForms);

    if (collectedAnswers.length > 0) {
      writeAnswers(formID, collectedAnswers);
    }

    // Vérifier si un autre formulaire utilise encore ce même fichier fields
    const stillUsed = updatedForms.some((f) => f.fields === formToDelete.fields);
    if (!stillUsed && formToDelete.fields) {
      const filePath = path.join(fieldsDirectory, path.basename(formToDelete.fields));
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
