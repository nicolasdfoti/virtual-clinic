"""Tests de la foto de perfil (data URL en users.photo)."""
from app.models.doctor import Doctor
from tests.conftest import login_as

PHOTO_PATH = "/api/profiles/me/photo"

VALID_PHOTO = "data:image/png;base64," + ("A" * 64)


def test_update_photo_requires_auth(client):
    resp = client.put(PHOTO_PATH, json={"photo": VALID_PHOTO})
    assert resp.status_code == 401


def test_update_photo_and_reflect_in_auth_me(client, user):
    login_as(client, user)

    resp = client.put(PHOTO_PATH, json={"photo": VALID_PHOTO})
    assert resp.status_code == 200
    assert resp.json()["photo"] == VALID_PHOTO

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["photo"] == VALID_PHOTO


def test_update_photo_with_null_clears_it(client, db_session, user):
    user.photo = VALID_PHOTO
    db_session.commit()

    login_as(client, user)
    resp = client.put(PHOTO_PATH, json={"photo": None})

    assert resp.status_code == 200
    assert resp.json()["photo"] is None


def test_update_photo_rejects_non_image(client, user):
    login_as(client, user)

    resp = client.put(PHOTO_PATH, json={"photo": "https://example.com/foto.png"})

    assert resp.status_code == 422


def test_update_photo_rejects_too_large(client, user):
    login_as(client, user)

    huge = "data:image/png;base64," + ("A" * 400_000)
    resp = client.put(PHOTO_PATH, json={"photo": huge})

    assert resp.status_code == 422


def test_public_doctor_list_includes_photo(client, db_session, doctor_user):
    doctor_user.photo = VALID_PHOTO

    doctor = (
        db_session.query(Doctor)
        .filter(Doctor.user_id == doctor_user.id)
        .first()
    )
    db_session.commit()

    resp = client.get("/api/public/doctors")
    assert resp.status_code == 200

    item = next(d for d in resp.json() if d["id"] == doctor.id)
    assert item["photo"] == VALID_PHOTO
