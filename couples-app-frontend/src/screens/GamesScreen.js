import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import apiClient from "../api/apiClient";
import { FONTS, RADIUS, SIZES, GRADIENTS, SHADOWS } from "../constants/theme";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import useThemeStore from "../store/useThemeStore";

const { width } = Dimensions.get("window");

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
  }
  if (squares.every(Boolean)) return "Draw";
  return null;
}

const TicTacToe = ({ styles, colors }) => {
  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);
  const partnerId = user?.partnerId;

  const [partnerName, setPartnerName] = useState("Partner");
  const [myMark, setMyMark] = useState(null);
  const [partnerMark, setPartnerMark] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState("X");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    apiClient.get("/auth/partner").then((res) => setPartnerName(res.data?.name || "Partner")).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleMarkReceived = ({ chosenMark }) => {
      const opposite = chosenMark === "X" ? "O" : "X";
      setPartnerMark(chosenMark);
      setMyMark(opposite);
    };
    const handleMoveReceived = (data) => {
      setBoard(data.board);
      setCurrentTurn(data.currentTurn);
      if (data.winner) setWinner(data.winner);
    };
    const handleResetReceived = () => {
      setBoard(Array(9).fill(null));
      setCurrentTurn("X");
      setWinner(null);
      setMyMark(null);
      setPartnerMark(null);
    };
    socket.on("game_mark_received", handleMarkReceived);
    socket.on("game_move_received", handleMoveReceived);
    socket.on("game_reset_received", handleResetReceived);
    return () => {
      socket.off("game_mark_received", handleMarkReceived);
      socket.off("game_move_received", handleMoveReceived);
      socket.off("game_reset_received", handleResetReceived);
    };
  }, [socket]);

  const isMyTurn = !!myMark && currentTurn === myMark && !winner;

  const handlePickMark = (mark) => {
    const opposite = mark === "X" ? "O" : "X";
    setMyMark(mark);
    setPartnerMark(opposite);
    if (socket && partnerId) socket.emit("game_mark_selected", { receiverId: partnerId, mark });
  };

  const handlePress = (index) => {
    if (!isMyTurn || board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = myMark;
    const nextTurn = myMark === "X" ? "O" : "X";
    const newWinner = calculateWinner(newBoard);
    setBoard(newBoard);
    setCurrentTurn(nextTurn);
    if (newWinner) setWinner(newWinner);
    if (socket && partnerId) {
      socket.emit("game_move", { receiverId: partnerId, board: newBoard, currentTurn: nextTurn, winner: newWinner });
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentTurn("X");
    setWinner(null);
    setMyMark(null);
    setPartnerMark(null);
    if (socket && partnerId) socket.emit("game_reset", { receiverId: partnerId });
  };

  if (!myMark) {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.eyebrow}>INITIATE CONNECTION</Text>
        <Text style={styles.pickTitle}>Select Your Pulse</Text>
        <Text style={styles.pickSub}>Universal synchronization is mandatory for competition.</Text>
        <View style={styles.pickRow}>
          {["X", "O"].map((mark) => (
            <TouchableOpacity key={mark} style={styles.pickCard} onPress={() => handlePickMark(mark)}>
              <BlurView intensity={30} tint="dark" style={styles.pickBlur}>
                <Text style={[styles.pickMark, mark === "X" ? styles.textPrimary : styles.textSecondary]}>{mark}</Text>
                <Text style={styles.pickLabel}>IGNITE AS {mark}</Text>
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gameContainer}>
      <View style={styles.playerRow}>
        <BlurView intensity={isMyTurn ? 40 : 15} tint="dark" style={[styles.playerBadge, isMyTurn && styles.badgeActive]}>
          <Text style={[styles.playerMark, { color: colors.primary }]}>{myMark}</Text>
          <Text style={styles.playerLabel}>YOU</Text>
        </BlurView>
        <Text style={styles.vsLabel}>SYNC</Text>
        <BlurView intensity={!isMyTurn ? 40 : 15} tint="dark" style={[styles.playerBadge, !isMyTurn && styles.badgeActivePartner]}>
          <Text style={[styles.playerMark, { color: colors.secondary }]}>{partnerMark}</Text>
          <Text style={styles.playerLabel}>{partnerName.toUpperCase()}</Text>
        </BlurView>
      </View>

      <Text style={styles.statusText}>{winner ? (winner === "Draw" ? "SYNC VOID" : "PULSE DOMINATED") : (isMyTurn ? "YOUR RHYTHM" : "AWAITING PARTNER")}</Text>

      <View style={styles.board}>
        {[0, 1, 2].map(row => (
          <View key={row} style={styles.boardRow}>
            {[0, 1, 2].map(col => {
              const idx = row * 3 + col;
              const val = board[idx];
              return (
                <TouchableOpacity key={idx} style={[styles.cell, val && styles.cellOccupied]} onPress={() => handlePress(idx)}>
                  <Text style={[styles.cellText, val === "X" ? styles.textPrimary : styles.textSecondary]}>{val}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetText}>DISSOLVE & RESTART</Text>
      </TouchableOpacity>
    </View>
  );
};

const Quiz = ({ styles, colors }) => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleAnswer = (opt) => {
    if (selected) return;
    setSelected(opt);
    setScore((s) => s + 1);
    setTimeout(() => {
      if (current + 1 >= QUIZ_QUESTIONS.length) setDone(true);
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 700);
  };

  if (done) {
    return (
      <View style={styles.quizDone}>
        <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
        <Text style={styles.quizDoneTitle}>Cognitive{"\n"}Synchronization</Text>
        <Text style={styles.quizDoneSub}>You achieved {score}/{QUIZ_QUESTIONS.length} resonance points.</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={() => { setCurrent(0); setScore(0); setDone(false); setSelected(null); }}>
          <Text style={styles.resetText}>REINITIATE QUIZ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = QUIZ_QUESTIONS[current];
  return (
    <View style={styles.quizContainer}>
       <Text style={styles.eyebrow}>RESONANCE TEST {current + 1}/{QUIZ_QUESTIONS.length}</Text>
       <View style={styles.quizProgressBar}><View style={[styles.quizProgressFill, { width: `${((current + 1) / QUIZ_QUESTIONS.length) * 100}%` }]} /></View>
       <Text style={styles.quizQuestion}>{q.q}</Text>
       <View style={styles.quizOptions}>
         {q.options.map(opt => (
           <TouchableOpacity key={opt} style={[styles.quizOption, selected === opt && styles.quizOptionSelected, selected && selected !== opt && styles.quizOptionFaded]} onPress={() => handleAnswer(opt)} disabled={!!selected}>
             <BlurView intensity={selected === opt ? 50 : 20} tint="dark" style={styles.optionBlur}>
                <Text style={[styles.quizOptionText, selected === opt && styles.textSecondary]}>{opt}</Text>
             </BlurView>
           </TouchableOpacity>
         ))}
       </View>
    </View>
  );
};

const QUIZ_QUESTIONS = [
  { q: "What's my favourite colour?", options: ["Blue", "Purple", "Red", "Green"] },
  { q: "What would I choose: beach or mountains?", options: ["Beach", "Mountains", "City", "Countryside"] },
  { q: "My love language is?", options: ["Words of Affirmation", "Physical Touch", "Acts of Service", "Gift Giving"] },
  { q: "I'm usually a...", options: ["Morning person", "Night owl", "Both", "Neither"] },
  { q: "Comfort food for me is?", options: ["Pizza", "Noodles", "Ice cream", "Biryani"] },
];

const GamesScreen = () => {
  const colors = useThemeStore((state) => state.colors);
  const styles = createStyles(colors);
  const [activeGame, setActiveGame] = useState(null);

  const renderBack = () => (
    <TouchableOpacity onPress={() => setActiveGame(null)} style={styles.backBtn}>
      <Text style={styles.backText}>← RETURN TO PLAYGROUND</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <View style={styles.glow} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!activeGame ? (
          <>
            <View style={styles.header}>
              <Text style={styles.eyebrow}>COOPERATIVE REALM</Text>
              <Text style={styles.heading}>Playground{"\n"}Editorial</Text>
              <Text style={styles.sub}>Forge connections through shared rhythm and cognitive resonance.</Text>
            </View>

            <TouchableOpacity style={styles.editorialCard} onPress={() => setActiveGame("ttt")}>
              <BlurView intensity={35} tint="dark" style={styles.cardBlur}>
                <Text style={styles.cardIcon}>⚔️</Text>
                <View>
                  <Text style={styles.cardTitle}>TIC TAC TOE</Text>
                  <Text style={styles.cardSub}>REAL-TIME PULSE SYNC</Text>
                </View>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editorialCard} onPress={() => setActiveGame("quiz")}>
              <BlurView intensity={35} tint="dark" style={styles.cardBlur}>
                <Text style={styles.cardIcon}>💡</Text>
                <View>
                  <Text style={styles.cardTitle}>RESONANCE TEST</Text>
                  <Text style={styles.cardSub}>COGNITIVE ALIGNMENT</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {renderBack()}
            {activeGame === "ttt" ? <TicTacToe styles={styles} colors={colors} /> : <Quiz styles={styles} colors={colors} />}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    glow: {
      position: "absolute", width: width * 1.2, height: width * 1.2, borderRadius: width * 0.6,
      backgroundColor: "rgba(138, 43, 226, 0.04)", top: -width * 0.5, left: -width * 0.3,
    },
    scroll: { paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
    header: { marginBottom: 44 },
    eyebrow: { fontFamily: FONTS.label, fontSize: 10, color: colors.primary, letterSpacing: 3, marginBottom: 12 },
    heading: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.75, color: colors.text, lineHeight: SIZES.display * 0.75, marginBottom: 16 },
    sub: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.textSub, width: "85%", lineHeight: 24 },
    backBtn: { marginBottom: 32 },
    backText: { fontFamily: FONTS.label, color: colors.textMuted, fontSize: 10, letterSpacing: 2 },
    
    editorialCard: { marginBottom: 20, borderRadius: RADIUS.xxl, overflow: "hidden", ...SHADOWS.ambient },
    cardBlur: { flexDirection: "row", alignItems: "center", padding: 28, gap: 20, borderWidth: 1, borderColor: colors.borderLight },
    cardIcon: { fontSize: 32, color: colors.text },
    cardTitle: { fontFamily: FONTS.headline, fontSize: SIZES.lg, color: colors.text, letterSpacing: 1 },
    cardSub: { fontFamily: FONTS.label, fontSize: 9, color: colors.primary, letterSpacing: 2, marginTop: 4 },
    
    gameContainer: { width: "100%" },
    pickTitle: { fontFamily: FONTS.display, fontSize: SIZES.xxl, color: colors.text, textAlign: "center", marginBottom: 8 },
    pickSub: { fontFamily: FONTS.body, fontSize: SIZES.base, color: colors.textSub, textAlign: "center", marginBottom: 36, lineHeight: 22 },
    pickRow: { flexDirection: "row", gap: 20 },
    pickCard: { flex: 1, height: 180, borderRadius: RADIUS.xxl, overflow: "hidden" },
    pickBlur: { flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderLight },
    pickMark: { fontFamily: FONTS.display, fontSize: 56, marginBottom: 12 },
    pickLabel: { fontFamily: FONTS.label, fontSize: 9, color: colors.textMuted, letterSpacing: 2 },
    
    playerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 32 },
    playerBadge: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: RADIUS.xl, overflow: "hidden", alignItems: "center", width: 110, borderWidth: 1, borderColor: colors.borderLight },
    badgeActive: { borderColor: colors.primary, backgroundColor: "rgba(138, 43, 226, 0.05)" },
    badgeActivePartner: { borderColor: colors.secondary, backgroundColor: "rgba(255, 77, 141, 0.05)" },
    playerMark: { fontFamily: FONTS.display, fontSize: SIZES.xxxl },
    playerLabel: { fontFamily: FONTS.label, fontSize: 8, color: colors.textMuted, letterSpacing: 2, marginTop: 4 },
    vsLabel: { fontFamily: FONTS.label, fontSize: 10, color: colors.textMuted, letterSpacing: 4 },
    
    statusText: { fontFamily: FONTS.headline, fontSize: SIZES.md, color: colors.primary, textAlign: "center", marginBottom: 28, letterSpacing: 2 },
    board: { gap: 12, alignSelf: "center", marginBottom: 32 },
    boardRow: { flexDirection: "row", gap: 12 },
    cell: { width: width * 0.24, height: width * 0.24, borderRadius: RADIUS.xl, backgroundColor: colors.surfaceContainerLow, alignItems: "center", justifyContent: "center" },
    cellOccupied: { backgroundColor: colors.surfaceContainerHighest },
    cellText: { fontFamily: FONTS.display, fontSize: 44 },
    
    resetBtn: { paddingVertical: 18, alignItems: "center", borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.borderLight },
    resetText: { fontFamily: FONTS.label, color: colors.textMuted, fontSize: 10, letterSpacing: 2 },
    
    quizContainer: { width: "100%" },
    quizProgressBar: { width: "100%", height: 3, backgroundColor: colors.surfaceContainerLow, borderRadius: 2, marginBottom: 32, overflow: "hidden" },
    quizProgressFill: { height: "100%", backgroundColor: colors.secondary },
    quizQuestion: { fontFamily: FONTS.display, fontSize: SIZES.xxl, color: colors.text, textAlign: "center", marginBottom: 40, lineHeight: 36 },
    quizOptions: { gap: 16 },
    quizOption: { borderRadius: RADIUS.xl, overflow: "hidden" },
    optionBlur: { paddingVertical: 20, alignItems: "center", borderWidth: 1, borderColor: colors.borderLight },
    quizOptionSelected: { borderColor: colors.secondary },
    quizOptionFaded: { opacity: 0.3 },
    quizOptionText: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.text },
    
    quizDone: { paddingTop: 20 },
    quizDoneTitle: { fontFamily: FONTS.display, fontSize: SIZES.display * 0.6, color: colors.text, marginBottom: 16, lineHeight: SIZES.display * 0.6 },
    quizDoneSub: { fontFamily: FONTS.body, fontSize: SIZES.md, color: colors.textSub, marginBottom: 40, lineHeight: 26 },
    
    textPrimary: { color: colors.primary },
    textSecondary: { color: colors.secondary },
  });

export default GamesScreen;
