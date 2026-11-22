"""Safe JSON errors; never include request content or exception messages in logs."""
import logging

from django.db import DatabaseError, IntegrityError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def safe_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return response
    if isinstance(exc, IntegrityError):
        return Response({"detail": "This change conflicts with existing data. Please reload and try again."}, status=409)
    if isinstance(exc, DatabaseError):
        logger.error("API database request failed (%s).", type(exc).__name__)
        return Response({"detail": "The database is temporarily unavailable. Please try again later."}, status=503)
    logger.error("API request failed (%s).", type(exc).__name__)
    return Response({"detail": "Unable to complete the request. Please try again later."}, status=500)
