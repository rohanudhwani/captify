# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
import os
import requests
from io import BytesIO
from PIL import Image as PILImage
import vertexai
from vertexai.preview.vision_models import Image, ImageTextModel

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Set the path to your service account JSON file
credentials_file = 'messmate-31e30-19e5d28128de.json'
credentials_path = os.path.join(os.getcwd(), credentials_file)
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

import tempfile

def get_short_form_image_captions(
    project_id: str, location: str, image_url: str
) -> str:
    """Get short-form captions for an image URL.
    Args:
      project_id: Google Cloud project ID, used to initialize Vertex AI.
      location: Google Cloud region, used to initialize Vertex AI.
      image_url: URL of the input image."""

    # Initialize Vertex AI
    vertexai.init(project=project_id, location=location)

    # Load image from URL
    response = requests.get(image_url)
    image = PILImage.open(BytesIO(response.content))

    # Save image to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
        image.save(temp_file, format="JPEG")
        temp_file_path = temp_file.name

    # Create a vertexai Image object from the temporary file
    vertex_image = Image.load_from_file(temp_file_path)

    # Load pre-trained model
    model = ImageTextModel.from_pretrained("imagetext@001")

    # Get captions
    captions = model.get_captions(
        image=vertex_image,
        # Optional parameters
        language="en",
        number_of_results=1,
    )

    # Clean up temporary file
    os.unlink(temp_file_path)

    return captions[0]




@app.route('/generate_caption', methods=['POST'])
def generate_caption():
    data = request.get_json()
    image_url = data['image_url']

    # Google Cloud project ID
    project_id = "messmate-31e30"
    # Google Cloud region
    location = "us-central1"

    # Call the function to get captions
    caption = get_short_form_image_captions(project_id, location, image_url)

    return jsonify({'caption': caption})

@app.route('/test_connection')
def test_connection():
    return 'Server is reachable'

if __name__ == '__main__':
    app.run(host='192.168.111.150', debug=True)
