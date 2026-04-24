# WebSocket event type constants — Client → Server
HOST_START_GAME = "host_start_game"
HOST_NEXT_QUESTION = "host_next_question"
HOST_END_QUESTION = "host_end_question"
HOST_END_GAME = "host_end_game"

PLAYER_JOIN = "player_join"
PLAYER_ANSWER = "player_answer"

# WebSocket event type constants — Server → Client
ROOM_JOINED = "room_joined"
PLAYER_JOINED = "player_joined"
PLAYER_LEFT = "player_left"
GAME_STARTING = "game_starting"
QUESTION_START = "question_start"
ANSWER_RECEIVED = "answer_received"
ANSWER_RESULT = "answer_result"
QUESTION_END = "question_end"
GAME_END = "game_end"
ERROR = "error"
ALL_ANSWERED = "all_answered"
HOST_DISCONNECTED = "host_disconnected"
