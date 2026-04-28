export async function generateDocumentFromTemplate(

  payload = {},
  templateFileName = "template.docx",
  downloadFileName = "document.docx",
) {
  console.log("payload", payload);
  if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
    throw new Error("Payload is required and cannot be empty");
  }

  // Construct template URL from public assets
  const templateUrl = `${import.meta.env.BASE_URL}assets/${templateFileName}`;

  // Fetch template with error handling
  let arrayBuffer = null;
  try {
    const response = await fetch(templateUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch template: ${response.status} ${response.statusText}`,
      );
    }
    arrayBuffer = await response.arrayBuffer();
  } catch (fetchError) {
    throw new Error(
      `Cannot access template at ${templateUrl}. Ensure the file exists in public/assets folder.`,
    );
  }

  // Dynamically import required libraries (keeps bundle smaller until needed)
  const { default: PizZip } = await import("pizzip");
  const { default: Docxtemplater } = await import("docxtemplater");

  // Initialize document template
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  // Render document with payload data
  doc.render(payload);

  // Generate blob from modified document
  const generatedBlob = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  // Trigger download
  const url = URL.createObjectURL(generatedBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return generatedBlob;
}

