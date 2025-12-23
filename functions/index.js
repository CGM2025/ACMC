const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.crearUsuarioPortal = functions.https.onCall((data, context) => {
  console.log("=== INICIO ===");
  console.log("Tipo de data:", typeof data);
  console.log("Keys en data:", data ? Object.keys(data) : "data es null");

  // Extraer datos
  // Extraer datos (pueden estar en data directamente o en data.data)
  const realData = data?.data || data;
  const email = realData?.email;
  const password = realData?.password;
  const clienteId = realData?.clienteId;
  const idToken = realData?.idToken;

  console.log("Email:", email);
  console.log("ClienteId:", clienteId);
  console.log("idToken existe:", !!idToken);

  // Si no hay token, error
  if (!idToken) {
    console.log("ERROR: No hay idToken");
    throw new functions.https.HttpsError(
        "unauthenticated",
        "No se recibio token",
    );
  }

  // Verificar token y continuar
  return admin.auth().verifyIdToken(idToken)
      .then((decodedToken) => {
        console.log("Token valido, UID:", decodedToken.uid);
        return admin.firestore().collection("usuarios").doc(decodedToken.uid).get();
      })
      .then((adminDoc) => {
        if (!adminDoc.exists) {
          throw new functions.https.HttpsError("permission-denied", "Usuario no encontrado");
        }

        const rol = adminDoc.data().rol;
        console.log("Rol:", rol);

        if (rol !== "admin") {
          throw new functions.https.HttpsError("permission-denied", "No eres admin");
        }

        // Validar datos
        if (!email || !password || !clienteId) {
          throw new functions.https.HttpsError("invalid-argument", "Faltan datos");
        }

        // Crear usuario
        return admin.auth().createUser({
          email: email,
          password: password,
          disabled: false,
        });
      })
      .then((userRecord) => {
        console.log("Usuario creado:", userRecord.uid);

        // Crear documento
        return admin.firestore().collection("usuarios").doc(userRecord.uid).set({
          email: email,
          rol: "cliente",
          clienteId: clienteId,
          activo: true,
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        }).then(() => userRecord);
      })
      .then((userRecord) => {
        console.log("=== EXITO ===");
        return {
          success: true,
          uid: userRecord.uid,
          email: email,
          message: "Usuario creado exitosamente",
        };
      })
      .catch((error) => {
        console.error("Error:", error.code, error.message);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        if (error.code === "auth/email-already-exists") {
          throw new functions.https.HttpsError("already-exists", "Email ya existe");
        }
        throw new functions.https.HttpsError("internal", error.message);
      });
});

exports.activarDesactivarUsuario = functions.https.onCall((data) => {
  const idToken = data?.idToken;
  const userId = data?.userId;
  const activo = data?.activo;

  if (!idToken) {
    throw new functions.https.HttpsError("unauthenticated", "Sin token");
  }

  return admin.auth().verifyIdToken(idToken)
      .then((decoded) => {
        return admin.firestore().collection("usuarios").doc(decoded.uid).get();
      })
      .then((doc) => {
        if (!doc.exists || doc.data().rol !== "admin") {
          throw new functions.https.HttpsError("permission-denied", "Sin permisos");
        }
        return admin.firestore().collection("usuarios").doc(userId).update({activo});
      })
      .then(() => {
        return admin.auth().updateUser(userId, {disabled: !activo});
      })
      .then(() => {
        return {success: true, message: activo ? "Activado" : "Desactivado"};
      });
});

exports.enviarResetPassword = functions.https.onCall((data) => {
  const idToken = data?.idToken;
  const email = data?.email;

  if (!idToken) {
    throw new functions.https.HttpsError("unauthenticated", "Sin token");
  }

  return admin.auth().verifyIdToken(idToken)
      .then((decoded) => {
        return admin.firestore().collection("usuarios").doc(decoded.uid).get();
      })
      .then((doc) => {
        if (!doc.exists || doc.data().rol !== "admin") {
          throw new functions.https.HttpsError("permission-denied", "Sin permisos");
        }
        return admin.auth().generatePasswordResetLink(email);
      })
      .then((link) => {
        return {success: true, link: link};
      });
});

/**
 * Crear usuario del sistema (admin, asistente, terapeuta)
 * Solo administradores pueden crear estos usuarios
 */
exports.crearUsuarioSistema = functions.https.onCall((data, context) => {
  console.log("=== CREAR USUARIO SISTEMA ===");

  const realData = data?.data || data;
  const email = realData?.email;
  const password = realData?.password;
  const nombre = realData?.nombre;
  const rol = realData?.rol;
  const terapeutaId = realData?.terapeutaId;
  const idToken = realData?.idToken;

  console.log("Email:", email);
  console.log("Nombre:", nombre);
  console.log("Rol:", rol);

  // Validar token
  if (!idToken) {
    throw new functions.https.HttpsError("unauthenticated", "No se recibió token");
  }

  // Validar rol permitido
  const rolesPermitidos = ["admin", "asistente", "terapeuta"];
  if (!rolesPermitidos.includes(rol)) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Rol no válido. Debe ser: admin, asistente o terapeuta",
    );
  }

  let adminOrgId = null;

  return admin.auth().verifyIdToken(idToken)
      .then((decodedToken) => {
        console.log("Token válido, UID:", decodedToken.uid);
        return admin.firestore().collection("usuarios").doc(decodedToken.uid).get();
      })
      .then((adminDoc) => {
        if (!adminDoc.exists) {
          throw new functions.https.HttpsError("permission-denied", "Usuario no encontrado");
        }

        const adminData = adminDoc.data();
        if (adminData.rol !== "admin") {
          throw new functions.https.HttpsError(
              "permission-denied",
              "Solo administradores pueden crear usuarios del sistema",
          );
        }

        // Guardar organizationId del admin
        adminOrgId = adminData.organizationId || "org_acmc_001";

        // Validar datos requeridos
        if (!email || !password || !nombre) {
          throw new functions.https.HttpsError("invalid-argument", "Faltan datos requeridos");
        }

        if (password.length < 8) {
          throw new functions.https.HttpsError(
              "invalid-argument",
              "La contraseña debe tener al menos 8 caracteres",
          );
        }

        // Crear usuario en Firebase Auth
        return admin.auth().createUser({
          email: email,
          password: password,
          displayName: nombre,
          disabled: false,
        });
      })
      .then((userRecord) => {
        console.log("Usuario creado en Auth:", userRecord.uid);

        // Crear documento en Firestore
        const userData = {
          email: email,
          nombre: nombre,
          rol: rol,
          activo: true,
          organizationId: adminOrgId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          passwordCambiada: false,
        };

        // Si es terapeuta, vincular con terapeutaId
        if (rol === "terapeuta" && terapeutaId) {
          userData.terapeutaId = terapeutaId;
        }

        return admin.firestore().collection("usuarios").doc(userRecord.uid).set(userData)
            .then(() => userRecord);
      })
      .then((userRecord) => {
        console.log("=== USUARIO SISTEMA CREADO ===");
        return {
          success: true,
          uid: userRecord.uid,
          email: email,
          nombre: nombre,
          rol: rol,
          message: "Usuario del sistema creado exitosamente",
        };
      })
      .catch((error) => {
        console.error("Error:", error.code, error.message);
        if (error instanceof functions.https.HttpsError) {
          throw error;
        }
        if (error.code === "auth/email-already-exists") {
          throw new functions.https.HttpsError("already-exists", "Ya existe un usuario con este email");
        }
        if (error.code === "auth/invalid-email") {
          throw new functions.https.HttpsError("invalid-argument", "Email inválido");
        }
        if (error.code === "auth/weak-password") {
          throw new functions.https.HttpsError("invalid-argument", "Contraseña muy débil");
        }
        throw new functions.https.HttpsError("internal", error.message);
      });
});
