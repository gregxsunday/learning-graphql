FROM python:3.9-slim as builder

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get -y update && apt-get -y install gcc python3-dev musl-dev  

# this line changes
COPY ./requirements.txt ./

RUN pip wheel --no-cache-dir --wheel-dir /usr/src/app/wheels -r requirements.txt

# === FINAL IMAGE ===

FROM python:3.9-slim

RUN addgroup --system app && adduser --system app --ingroup app

# Create directories app_home and static directories
ENV HOME=/home/app
ENV APP_HOME=/home/app/web
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# Copy dependencies from builder image
RUN apt-get -y update && apt-get -y install libpq-dev 

COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .

RUN pip install --no-cache --no-deps /wheels/*

COPY . $APP_HOME

RUN chown -R app:app $APP_HOME

USER app

RUN python manage.py collectstatic --noinput

CMD python manage.py runserver 0.0.0.0:8000
