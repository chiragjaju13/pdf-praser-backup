from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import json
import uuid
import io
import os
import fitz
from core.image_engine import ImageEngine
import zipfile

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job storage (for MVP)
jobs = {}


@app.post("/api/jobs")
async def create_job(
    pdfs: list[UploadFile] = File(...),
    image: UploadFile = File(...),
    config: str = Form(...)
):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "processing", "result": None, "is_multiple": len(pdfs) > 1}

    try:
        config_data = json.loads(config)
        image_bytes = await image.read()

        engine = ImageEngine()

        if not jobs[job_id]["is_multiple"]:
            # Single PDF processing
            pdf_bytes = await pdfs[0].read()
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for op in config_data.get('operations', []):
                if op['type'] == 'add_image':
                    doc = engine.process_operation(doc, op, image_bytes)

            output_stream = io.BytesIO()
            doc.save(output_stream, garbage=4, deflate=True, clean=True)
            doc.close()
            output_stream.seek(0)
            jobs[job_id]["result"] = output_stream.read()

        else:
            # Multi-PDF processing with ZIP
            zip_stream = io.BytesIO()
            with zipfile.ZipFile(zip_stream, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for pdf_file in pdfs:
                    pdf_bytes = await pdf_file.read()
                    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                    for op in config_data.get('operations', []):
                        if op['type'] == 'add_image':
                            doc = engine.process_operation(doc, op, image_bytes)

                    pdf_out = io.BytesIO()
                    doc.save(pdf_out, garbage=4, deflate=True, clean=True)
                    doc.close()
                    pdf_out.seek(0)
                    zip_file.writestr(pdf_file.filename, pdf_out.read())

            zip_stream.seek(0)
            jobs[job_id]["result"] = zip_stream.read()

        jobs[job_id]["status"] = "done"

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        print(f"Job Failed: {e}")

    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"status": jobs[job_id]["status"], "error": jobs[job_id].get("error")}


@app.get("/api/jobs/{job_id}/download")
async def download_job_result(job_id: str):
    if job_id not in jobs or jobs[job_id]["status"] != "done":
        raise HTTPException(status_code=404, detail="Result not ready")

    is_multiple = jobs[job_id].get("is_multiple", False)
    ext = "zip" if is_multiple else "pdf"
    mime = "application/zip" if is_multiple else "application/pdf"

    return Response(
        content=jobs[job_id]["result"],
        media_type=mime,
        headers={"Content-Disposition": f"attachment; filename=signed_output.{ext}"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)