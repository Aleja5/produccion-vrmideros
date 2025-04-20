const Operario = require("../models/Operario");

// Validar si un operario existe en la base de datos con su cédula
exports.validateCedula = async (req, res) => {
    const { cedula } = req.body;

    if (!cedula) {
        return res.status(400).json({ message: "La cédula es requerida" });
    }

    try {
        // Buscar al operario por su cédula
        const operario = await Operario.findOne({ cedula });

        if (!operario) {
            return res.status(404).json({ message: "Operario no encontrado" });
        }

        res.status(200).json({
            message: "Cédula válida, acceso permitido",
            operario: {
                id: operario._id,
                name: operario.name,
                cedula: operario.cedula,
            }
        });
    } catch (error) {
        console.error("Error al validar la cédula:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
};
