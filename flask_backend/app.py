import os
import cv2
import PIL
import numpy as np
import google.generativeai as genai
import streamlit as st
import requests
import datetime
from streamlit_extras.add_vertical_space import add_vertical_space
from mediapipe.python.solutions import hands, drawing_utils

import warnings

warnings.filterwarnings(action='ignore')

st.set_page_config(page_title='AI App', layout="wide")

# Load GOOGLE_API_KEY from .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    st.error("GOOGLE_API_KEY is not set in .env file")
    st.stop()

class DrawInAir:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.cap.set(propId=cv2.CAP_PROP_FRAME_WIDTH, value=950)
        self.cap.set(propId=cv2.CAP_PROP_FRAME_HEIGHT, value=550)
        self.cap.set(propId=cv2.CAP_PROP_BRIGHTNESS, value=130)
        self.imgCanvas = np.zeros(shape=(550, 950, 3), dtype=np.uint8)
        self.mphands = hands.Hands(max_num_hands=1, min_detection_confidence=0.75)
        self.p1, self.p2 = 0, 0
        self.p_time = 0
        self.fingers = []

    def streamlit_config(self):
        page_background_color = """
        <style>
        [data-testid="stHeader"] 
        {
        background: rgba(0,0,0,0);
        }
        .block-container {
            padding-top: 0rem;
        }
        </style>
        """
        st.markdown(page_background_color, unsafe_allow_html=True)
        st.markdown(f'<h1 style="text-align: center;">DrawInAir</h1>', unsafe_allow_html=True)
        add_vertical_space(1)

    def process_frame(self):
        success, img = self.cap.read()
        img = cv2.resize(src=img, dsize=(950, 550))
        self.img = cv2.flip(src=img, flipCode=1)
        self.imgRGB = cv2.cvtColor(self.img, cv2.COLOR_BGR2RGB)

    def process_hands(self):
        result = self.mphands.process(image=self.imgRGB)
        self.landmark_list = []
        if result.multi_hand_landmarks:
            for hand_lms in result.multi_hand_landmarks:
                drawing_utils.draw_landmarks(image=self.img, landmark_list=hand_lms, connections=hands.HAND_CONNECTIONS)
                for id, lm in enumerate(hand_lms.landmark):
                    h, w, c = self.img.shape
                    x, y = lm.x, lm.y
                    cx, cy = int(x * w), int(y * h)
                    self.landmark_list.append([id, cx, cy])

    def identify_fingers(self):
        self.fingers = []
        if self.landmark_list != []:
            for id in [4, 8, 12, 16, 20]:
                if id != 4:
                    if self.landmark_list[id][2] < self.landmark_list[id - 2][2]:
                        self.fingers.append(1)
                    else:
                        self.fingers.append(0)
                else:
                    if self.landmark_list[id][1] < self.landmark_list[id - 2][1]:
                        self.fingers.append(1)
                    else:
                        self.fingers.append(0)
            for i in range(0, 5):
                if self.fingers[i] == 1:
                    cx, cy = self.landmark_list[(i + 1) * 4][1], self.landmark_list[(i + 1) * 4][2]
                    cv2.circle(img=self.img, center=(cx, cy), radius=5, color=(255, 0, 255), thickness=1)

    def handle_drawing_mode(self):
        if sum(self.fingers) == 2 and self.fingers[0] == self.fingers[1] == 1:
            cx, cy = self.landmark_list[8][1], self.landmark_list[8][2]
            if self.p1 == 0 and self.p2 == 0:
                self.p1, self.p2 = cx, cy
            cv2.line(img=self.imgCanvas, pt1=(self.p1, self.p2), pt2=(cx, cy), color=(255, 0, 255), thickness=5)
            self.p1, self.p2 = cx, cy
        elif sum(self.fingers) == 3 and self.fingers[0] == self.fingers[1] == self.fingers[2] == 1:
            self.p1, self.p2 = 0, 0
        elif sum(self.fingers) == 2 and self.fingers[0] == self.fingers[2] == 1:
            cx, cy = self.landmark_list[12][1], self.landmark_list[12][2]
            if self.p1 == 0 and self.p2 == 0:
                self.p1, self.p2 = cx, cy
            cv2.line(img=self.imgCanvas, pt1=(self.p1, self.p2), pt2=(cx, cy), color=(0, 0, 0), thickness=15)
            self.p1, self.p2 = cx, cy
        elif sum(self.fingers) == 2 and self.fingers[0] == self.fingers[4] == 1:
            self.imgCanvas = np.zeros(shape=(550, 950, 3), dtype=np.uint8)

    def blend_canvas_with_feed(self):
        img = cv2.addWeighted(src1=self.img, alpha=0.7, src2=self.imgCanvas, beta=1, gamma=0)
        imgGray = cv2.cvtColor(self.imgCanvas, cv2.COLOR_BGR2GRAY)
        _, imgInv = cv2.threshold(src=imgGray, thresh=50, maxval=255, type=cv2.THRESH_BINARY_INV)
        imgInv = cv2.cvtColor(imgInv, cv2.COLOR_GRAY2BGR)
        img = cv2.bitwise_and(src1=img, src2=imgInv)
        self.img = cv2.bitwise_or(src1=img, src2=self.imgCanvas)

    def send_proctoring_event(self, event_type, user_id="student123"):
        try:
            url = "http://localhost:5000/api/proctoring/log"
            data = {
                "userId": user_id,  # Replace with actual user ID (e.g., from JWT)
                "event": event_type,
                "timestamp": str(datetime.datetime.now())
            }
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, json=data, headers=headers)
            return response.json()
        except Exception as e:
            st.error(f"Error sending proctoring event: {str(e)}")
            return None

    def send_webcam_snapshot(self, user_id="student123"):
        try:
            _, buffer = cv2.imencode('.jpg', self.img)
            files = {'snapshot': ('snapshot.jpg', buffer, 'image/jpeg')}
            data = {'userId': user_id, 'timestamp': str(datetime.datetime.now())}
            response = requests.post('http://localhost:5000/api/proctoring/snapshot', files=files, data=data)
            return response.json()
        except Exception as e:
            st.error(f"Error sending snapshot: {str(e)}")
            return None

    def analyze_image_with_genai(self):
        imgCanvas = cv2.cvtColor(self.imgCanvas, cv2.COLOR_BGR2RGB)
        imgCanvas = PIL.Image.fromarray(imgCanvas)
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(model_name='gemini-1.5-flash')
        prompt = "Analyze the image and provide the following:\n" \
                 "* If a mathematical equation is present:\n" \
                 "   - The equation represented in the image.\n" \
                 "   - The solution to the equation.\n" \
                 "   - A short explanation of the steps taken to arrive at the solution.\n" \
                 "* If a drawing is present and no equation is detected:\n" \
                 "   - A brief description of the drawn image in simple terms.\n"
        response = model.generate_content([prompt, imgCanvas])
        return response.text

    def main(self):
        col1, _, col3 = st.columns([0.8, 0.02, 0.18])
        with col1:
            stframe = st.empty()
        with col3:
            st.markdown("""
                <h5 style="text-align: center;">Finger Gestures:</h5>
                <ul>
                    <li><b>Thumb + Index:</b> Start drawing.</li>
                    <li><b>Thumb + Middle:</b> Erase the drawing.</li>
                    <li><b>Thumb + Index + Middle:</b> Move </li>
                    <li><b>Thumb + Pinky:</b> Clear drawing.</li>
                    <li><b>Index + Middle:</b> Search/Calculate.</li>
                </ul>
                """, unsafe_allow_html=True)
            st.markdown(f'<h5 style="text-align: center;color: cyan;">OUTPUT:</h5>', unsafe_allow_html=True)
            result_placeholder = st.empty()

        last_snapshot_time = 0
        snapshot_interval = 10  # Send snapshot every 10 seconds

        while True:
            if not self.cap.isOpened():
                add_vertical_space(5)
                st.markdown(body=f'<h4 style="text-align: center; color: orange;">Error: Could not open webcam. \
                                    Please ensure your webcam is connected and try again</h4>', 
                            unsafe_allow_html=True)
                break

            self.process_frame()
            self.process_hands()
            self.identify_fingers()
            self.handle_drawing_mode()
            self.blend_canvas_with_feed()

            self.img = cv2.cvtColor(self.img, cv2.COLOR_BGR2RGB)
            stframe.image(self.img, channels="RGB")

            # Send proctoring event and snapshot
            current_time = time.time()
            if sum(self.fingers) == 2 and self.fingers[1] == self.fingers[2] == 1:
                result = self.analyze_image_with_genai()
                result_placeholder.write(f"Result: {result}")
                self.send_proctoring_event("image_analysis_triggered")
            if current_time - last_snapshot_time >= snapshot_interval:
                self.send_webcam_snapshot()
                last_snapshot_time = current_time

        self.cap.release()
        cv2.destroyAllWindows()

def image_reader():
    st.header("Image Reader Application")
    genai.configure(api_key=GOOGLE_API_KEY)
    def get_gemini_response(input_text, image, prompt):
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([input_text, image[0], prompt])
        return response.text
    def input_image_setup(uploaded_file):
        if uploaded_file is not None:
            bytes_data = uploaded_file.getvalue()
            image_parts = [{"mime_type": uploaded_file.type, "data": bytes_data}]
            return image_parts
        else:
            raise FileNotFoundError("No file uploaded")
    uploaded_file = st.file_uploader("Upload an Image", type=["jpg", "jpeg", "png"])
    input_text = st.text_area("Input Text", height=100)
    if st.button("Analyze Image"):
        try:
            image_parts = input_image_setup(uploaded_file)
            prompt = "Analyze the image and provide details based on the text input."
            response = get_gemini_response(input_text, image_parts, prompt)
            st.text_area("AI Response", response, height=300)
        except Exception as e:
            st.error(str(e))

def plot_crafter():
    st.header("Plot Crafter Application")
    st.write("This section generates a plot for your game or story.")
    game_prompt = st.text_area("Enter the game plot or theme:", height=150)
    if st.button("Generate Plot"):
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Create a detailed plot based on the theme: {game_prompt}"
        response = model.generate_content([prompt])
        st.text_area("Generated Plot", response.text, height=300)

def main_app():
    st.title("GenerativeAI-Powered Applications - By Team HackX")
    app_mode = st.selectbox("Choose an application:", ["DrawInAir", "Image Reader", "Plot Crafter"])
    if app_mode == "DrawInAir":
        drawinair = DrawInAir()
        drawinair.streamlit_config()
        drawinair.main()
    elif app_mode == "Image Reader":
        image_reader()
    elif app_mode == "Plot Crafter":
        plot_crafter()

if __name__ == "__main__":
    main_app()