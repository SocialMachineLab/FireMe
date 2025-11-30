import logging
from celery import shared_task


logger = logging.getLogger(__name__)

@shared_task
def heartbeat():
    logger.info("🔥 [Celery heartbeat] Task ran successfully.")
    print("🔥 [Celery heartbeat] Task ran successfully.")