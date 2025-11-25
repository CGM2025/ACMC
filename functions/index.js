const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.crearUsuarioPortal = functions.https.onCall(async (data) => {
  const {email, password, clienteId, idToken} = data;

  console.log("Datos recibidos - email:", email, "clienteId:", clienteId);
  console.log("Token recibido:", idToken ? "Sí" : "No");

  // Verificar token manualmente
  if (!idToken) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "No se recibió token de autenticación",
    );
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Token válido, UID:", decodedToken.uid);
  } catch (err) {
    console.error("Token inválido:", err.message);
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Token inválido",
    );
  }

  const adminUid = decodedToken.uid;

  // Verificar rol admin
  const adminDoc = await admin.firestore()
      .collection("usuarios").doc(adminUid).get();

  if (!adminDoc.exists) {
    console.log("Usuario no existe en Firestore");
    throw new functions.https.HttpsError(
        "permission-denied",
        "Usuario no encontrado",
    );
  }

  const adminData = adminDoc.data();
  console.log("Rol del usuario:", adminData.rol);

  if (adminData.rol !== "admin") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "No tienes permisos de administrador",
    );
  }

  // Validaciones
  if (!email || !password || !clienteId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Faltan datos",
    );
  }

  // Verificar cliente existe
  const clienteDoc = await admin.firestore()
      .collection("clientes").doc(clienteId).get();

  if (!clienteDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Cliente no existe");
  }

  // Verificar no existe usuario para este cliente
  const existing = await admin.firestore()
      .collection("usuarios")
      .where("clienteId", "==", clienteId)
      .where("rol", "==", "cliente")
      .get();

  if (!existing.empty) {
    throw new functions.https.HttpsError(
        "already-exists",
        "Ya existe usuario para este cliente",
    );
  }

  // Crear usuario en Auth
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false,
    });
    console.log("Usuario creado:", userRecord.uid);
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new functions.https.HttpsError(
          "already-exists",
          "Email ya existe",
      );
    }
    throw new functions.https.HttpsError("internal", err.message);
  }

  // Crear documento en Firestore
  await admin.firestore().collection("usuarios").doc(userRecord.uid).set({
    email: email,
    rol: "cliente",
    clienteId: clienteId,
    activo: true,
    fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
    creadoPor: adminUid,
  });

  console.log("Documento creado exitosamente");

  return {
    success: true,
    uid: userRecord.uid,
    email: email,
    message: "Usuario creado exitosamente",
  };
});

exports.activarDesactivarUsuario = functions.https.onCall(async (data) => {
  const {userId, activo, idToken} = data;

  if (!idToken) {
    throw new functions.https.HttpsError("unauthenticated", "Sin token");
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  const adminDoc = await admin.firestore()
      .collection("usuarios").doc(decoded.uid).get();

  if (!adminDoc.exists || adminDoc.data().rol !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Sin permisos");
  }

  await admin.firestore().collection("usuarios").doc(userId).update({
    activo: activo,
  });

  await admin.auth().updateUser(userId, {disabled: !activo});

  return {success: true, message: activo ? "Activado" : "Desactivado"};
});

exports.enviarResetPassword = functions.https.onCall(async (data) => {
  const {email, idToken} = data;

  if (!idToken) {
    throw new functions.https.HttpsError("unauthenticated", "Sin token");
  }

  const decoded = await admin.auth().verifyIdToken(idToken);
  const adminDoc = await admin.firestore()
      .collection("usuarios").doc(decoded.uid).get();

  if (!adminDoc.exists || adminDoc.data().rol !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Sin permisos");
  }

  const link = await admin.auth().generatePasswordResetLink(email);
  return {success: true, link: link};
});
