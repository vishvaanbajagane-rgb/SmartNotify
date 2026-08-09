"""
Integration tests for the full pipeline: upload -> predict -> analytics -> export.
Uses a small inline CSV rather than the bundled sample dataset, so this test
suite doesn't depend on that file's exact contents staying the same.
"""
import io

SAMPLE_CSV = b"""sender,sender_type,content,message_type,forward_count,is_verified_business
Trusted Bank,business,Your OTP is 123456 do not share it,text,0,true
Scammer,contact,Congratulations you won a lottery click here to claim now,text,50,false
Friend,contact,Hey want to grab lunch tomorrow?,text,0,false
"""


def test_upload_ingests_all_rows(client):
    r = client.post(
        "/api/v1/upload",
        files={"file": ("test.csv", io.BytesIO(SAMPLE_CSV), "text/csv")},
    )
    assert r.status_code == 200
    assert r.json()["rows_ingested"] == 3


def test_upload_accepts_whatsapp_export_style_columns(client):
    csv_bytes = b"""Phone Number,Message,Date
+1234567890,Hey are we still meeting today?,2026-01-01 10:00:00
"""
    r = client.post(
        "/api/v1/upload", files={"file": ("export.csv", io.BytesIO(csv_bytes), "text/csv")}
    )
    assert r.status_code == 200
    assert r.json()["rows_ingested"] == 1


def test_upload_accepts_sms_export_style_columns(client):
    csv_bytes = b"""From,Body,SentAt
+1234567890,Your package has shipped,2026-01-01 10:00:00
"""
    r = client.post(
        "/api/v1/upload", files={"file": ("sms.csv", io.BytesIO(csv_bytes), "text/csv")}
    )
    assert r.status_code == 200
    assert r.json()["rows_ingested"] == 1


def test_upload_accepts_minimal_two_column_csv(client):
    csv_bytes = b"""name,text
Bob,Hey there
"""
    r = client.post(
        "/api/v1/upload", files={"file": ("minimal.csv", io.BytesIO(csv_bytes), "text/csv")}
    )
    assert r.status_code == 200
    assert r.json()["rows_ingested"] == 1


def test_upload_rejects_non_csv(client):
    r = client.post(
        "/api/v1/upload",
        files={"file": ("test.txt", io.BytesIO(b"not a csv"), "text/plain")},
    )
    assert r.status_code == 400


def test_batch_predict_classifies_verified_business_as_notify(client):
    client.post(
        "/api/v1/upload", files={"file": ("test.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    )
    r = client.post("/api/v1/predict/batch")
    assert r.status_code == 200
    predictions = r.json()["predictions"]
    assert len(predictions) == 3

    messages = {m["id"]: m for m in client.get("/api/v1/messages").json()}
    otp_prediction = next(
        p for p in predictions if "OTP" in messages[p["message_id"]]["content"]
    )
    assert otp_prediction["action"] == "Notify"
    assert otp_prediction["business_trust_score"] >= 0.85


def test_batch_predict_without_data_returns_404(client):
    r = client.post("/api/v1/predict/batch")
    assert r.status_code == 404


def test_analytics_totals_match_ingested_count(client):
    client.post(
        "/api/v1/upload", files={"file": ("test.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    )
    client.post("/api/v1/predict/batch")

    r = client.get("/api/v1/analytics")
    assert r.status_code == 200
    body = r.json()
    assert body["total_messages"] == 3
    action_sum = sum(body["action_breakdown"].values())
    assert action_sum == 3


def test_export_csv_after_predictions_succeeds(client):
    client.post(
        "/api/v1/upload", files={"file": ("test.csv", io.BytesIO(SAMPLE_CSV), "text/csv")}
    )
    client.post("/api/v1/predict/batch")

    r = client.get("/api/v1/export/output-csv")
    assert r.status_code == 200
    assert r.headers["content-type"] == "text/csv; charset=utf-8"


def test_export_csv_without_predictions_returns_404(client):
    r = client.get("/api/v1/export/output-csv")
    assert r.status_code == 404
