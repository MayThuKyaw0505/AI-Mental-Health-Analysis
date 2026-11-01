# from transformers import pipeline


# sentiment_analyzer = None
# emotion_analyzer = None


# def get_sentiment_analyzer():
#     global sentiment_analyzer

#     if sentiment_analyzer is None:
#         sentiment_analyzer = pipeline(
#             "sentiment-analysis"
#         )

#     return sentiment_analyzer


# def get_emotion_analyzer():
#     global emotion_analyzer

#     if emotion_analyzer is None:
#         emotion_analyzer = pipeline(
#             "text-classification",
#             model="j-hartmann/emotion-english-distilroberta-base"
#         )

#     return emotion_analyzer


# def analyze_sentiment(text):
#     analyzer = get_sentiment_analyzer()

#     result = analyzer(text)[0]

#     return {
#         "sentiment": result["label"].lower(),
#         "sentiment_confidence": round(result["score"], 4),
#     }


# def analyze_emotion(text):
#     analyzer = get_emotion_analyzer()

#     result = analyzer(text)[0]

#     return {
#         "emotion": result["label"].lower(),
#         "emotion_confidence": round(result["score"], 4),
#     }

from transformers import pipeline

sentiment_analyzer = None
emotion_analyzer = None


def get_sentiment_analyzer():
    global sentiment_analyzer

    if sentiment_analyzer is None:
        sentiment_analyzer = pipeline(
            "text-classification",
            model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
        )

    return sentiment_analyzer


def get_emotion_analyzer():
    global emotion_analyzer

    if emotion_analyzer is None:
        emotion_analyzer = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
        )

    return emotion_analyzer


def analyze_sentiment(text):
    result = get_sentiment_analyzer()(text, truncation=True)[0]

    return {
        "sentiment": result["label"].lower(),
        "sentiment_confidence": round(result["score"], 4),
    }


def analyze_emotion(text):
    result = get_emotion_analyzer()(text, truncation=True)[0]

    return {
        "emotion": result["label"].lower(),
        "emotion_confidence": round(result["score"], 4),
    }
