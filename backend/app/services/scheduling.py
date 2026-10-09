from __future__ import annotations

from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.config import CLINIC_TIMEZONE
from app.models.enums import ACTIVE_APPOINTMENT_STATUSES

CLINIC_TZ = ZoneInfo(CLINIC_TIMEZONE)


def to_utc(dt: datetime) -> datetime:
    """Convierte datetime a UTC.

    Si es naive, asume que es hora local de la clinica.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=CLINIC_TZ)

    return dt.astimezone(ZoneInfo("UTC"))


def from_utc(dt: datetime) -> datetime:
    """Convierte datetime UTC a hora local de la clinica.

    Siempre devuelve datetime con tzinfo de la clinica.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))

    return dt.astimezone(CLINIC_TZ)


def local_date_start(d: date) -> datetime:
    return datetime.combine(d, time.min, tzinfo=CLINIC_TZ)


def local_date_end(d: date) -> datetime:
    return datetime.combine(d, time.max, tzinfo=CLINIC_TZ)


def _intervals_overlap(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
    return start1 < end2 and start2 < end1


def generate_slots(
    *,
    doctor,
    availability_rows,
    time_off_rows,
    appointments_rows,
    from_dt: datetime,
    to_dt: datetime,
    duration_minutes: int | None = None,
) -> list[datetime]:
    duration = timedelta(
        minutes=duration_minutes or getattr(doctor, "consultation_minutes", 30) or 30
    )

    from_local = from_dt if from_dt.tzinfo else from_dt.replace(tzinfo=CLINIC_TZ)
    to_local = to_dt if to_dt.tzinfo else to_dt.replace(tzinfo=CLINIC_TZ)

    if from_local > to_local:
        return []

    slots: list[datetime] = []

    current = from_local.replace(hour=0, minute=0, second=0, microsecond=0)
    end_day = to_local.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    while current < end_day:
        weekday = current.weekday()
        day = current.date()

        for av in availability_rows:
            if getattr(av, "doctor_id", None) != doctor.id:
                continue
            if getattr(av, "weekday", None) != weekday:
                continue

            start_av = datetime.combine(day, av.start_time, tzinfo=CLINIC_TZ)
            end_av = datetime.combine(day, av.end_time, tzinfo=CLINIC_TZ)

            if end_av <= start_av:
                continue

            slot_start = start_av
            while slot_start + duration <= end_av:
                slot_utc = to_utc(slot_start)
                slot_end_utc = to_utc(slot_start + duration)

                is_blocked = False

                for toff in time_off_rows:
                    if getattr(toff, "doctor_id", None) != doctor.id:
                        continue
                    toff_start = getattr(toff, "starts_at", None)
                    toff_end = getattr(toff, "ends_at", None)
                    if toff_start is None or toff_end is None:
                        continue
                    if toff_start.tzinfo is None:
                        toff_start = toff_start.replace(tzinfo=ZoneInfo("UTC"))
                    if toff_end.tzinfo is None:
                        toff_end = toff_end.replace(tzinfo=ZoneInfo("UTC"))
                    if _intervals_overlap(slot_utc, slot_end_utc, toff_start, toff_end):
                        is_blocked = True
                        break

                if not is_blocked:
                    for appt in appointments_rows:
                        if getattr(appt, "doctor_id", None) != doctor.id:
                            continue
                        status = getattr(appt, "status", None)
                        if status not in ACTIVE_APPOINTMENT_STATUSES:
                            continue
                        ap_start = getattr(appt, "starts_at", None)
                        ap_end = getattr(appt, "ends_at", None)
                        if ap_start is None or ap_end is None:
                            continue
                        if ap_start.tzinfo is None:
                            ap_start = ap_start.replace(tzinfo=ZoneInfo("UTC"))
                        if ap_end.tzinfo is None:
                            ap_end = ap_end.replace(tzinfo=ZoneInfo("UTC"))
                        if _intervals_overlap(slot_utc, slot_end_utc, ap_start, ap_end):
                            is_blocked = True
                            break

                if not is_blocked:
                    from_bound = to_utc(from_local)
                    to_bound = to_utc(to_local)
                    if slot_utc >= from_bound and slot_utc < to_bound:
                        slots.append(slot_utc)

                slot_start += duration

        current += timedelta(days=1)

    slots.sort()

    return slots
