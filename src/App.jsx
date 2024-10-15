import React, { useState, useEffect, useRef } from "react";
import "./styles.css"; // Make sure to create this file for custom styles

const KinematicsVisualization = () => {
  const [theta1, setTheta1] = useState(45);
  const [theta2, setTheta2] = useState(45);
  const [targetX, setTargetX] = useState(4);
  const [targetY, setTargetY] = useState(5);
  const [L1, setL1] = useState(4);
  const [L2, setL2] = useState(5);
  const [endEffectorPosition, setEndEffectorPosition] = useState({
    x: 0,
    y: 0,
  });
  const [calculatedAngles, setCalculatedAngles] = useState({
    theta1: 0,
    theta2: 0,
  });

  const canvasRef = useRef(null);

  const forwardKinematics = (theta1, theta2, L1, L2) => {
    const x = L1 * Math.cos(theta1) + L2 * Math.cos(theta1 + theta2);
    const y = L1 * Math.sin(theta1) + L2 * Math.sin(theta1 + theta2);
    return [x, y];
  };

  const inverseKinematics = (x, y, L1, L2) => {
    const cos_theta2 = (x * x + y * y - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const theta2 = Math.acos(Math.max(-1, Math.min(1, cos_theta2)));
    const theta1 =
      Math.atan2(y, x) -
      Math.atan2(L2 * Math.sin(theta2), L1 + L2 * Math.cos(theta2));
    return [theta1, theta2];
  };

  const drawArm = (ctx, x1, y1, x2, y2, color) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const scale = 27.5;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 0.5;
    for (let i = -10; i <= 10; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(offsetX + i * scale, 0);
      ctx.lineTo(offsetX + i * scale, canvas.height);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, offsetY - i * scale);
      ctx.lineTo(canvas.width, offsetY - i * scale);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);
    ctx.stroke();

    // Draw numbers on axes
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = -10; i <= 10; i++) {
      if (i !== 0) {
        // X-axis numbers
        ctx.fillText(i.toString(), offsetX + i * scale, offsetY + 20);
        // Y-axis numbers
        ctx.fillText((-i).toString(), offsetX - 20, offsetY + i * scale);
      }
    }

    // Calculate forward kinematics
    const [endX, endY] = forwardKinematics(
      (theta1 * Math.PI) / 180,
      (theta2 * Math.PI) / 180,
      L1,
      L2
    );
    const joint2X = L1 * Math.cos((theta1 * Math.PI) / 180);
    const joint2Y = L1 * Math.sin((theta1 * Math.PI) / 180);

    // Draw forward kinematics arm
    ctx.lineWidth = 3;
    // L1 segment
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX + joint2X * scale, offsetY - joint2Y * scale);
    ctx.stroke();
    // L2 segment
    ctx.strokeStyle = "lightblue";
    ctx.beginPath();
    ctx.moveTo(offsetX + joint2X * scale, offsetY - joint2Y * scale);
    ctx.lineTo(offsetX + endX * scale, offsetY - endY * scale);
    ctx.stroke();

    // Calculate inverse kinematics
    const [ikTheta1, ikTheta2] = inverseKinematics(targetX, targetY, L1, L2);
    const [ikEndX, ikEndY] = forwardKinematics(ikTheta1, ikTheta2, L1, L2);
    const ikJoint2X = L1 * Math.cos(ikTheta1);
    const ikJoint2Y = L1 * Math.sin(ikTheta1);

    // Draw inverse kinematics arm
    // L1 segment
    ctx.strokeStyle = "green";
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.lineTo(offsetX + ikJoint2X * scale, offsetY - ikJoint2Y * scale);
    ctx.stroke();
    // L2 segment
    ctx.strokeStyle = "lightgreen";
    ctx.beginPath();
    ctx.moveTo(offsetX + ikJoint2X * scale, offsetY - ikJoint2Y * scale);
    ctx.lineTo(offsetX + ikEndX * scale, offsetY - ikEndY * scale);
    ctx.stroke();

    // Draw joints
    ctx.fillStyle = "black";
    const drawJoint = (x, y) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    };
    drawJoint(offsetX, offsetY); // Base joint
    drawJoint(offsetX + joint2X * scale, offsetY - joint2Y * scale); // Forward kinematics middle joint
    drawJoint(offsetX + ikJoint2X * scale, offsetY - ikJoint2Y * scale); // Inverse kinematics middle joint

    // Draw target point
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(
      offsetX + targetX * scale,
      offsetY - targetY * scale,
      5,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Update state variables
    setEndEffectorPosition({ x: endX.toFixed(2), y: endY.toFixed(2) });
    setCalculatedAngles({
      theta1: ((ikTheta1 * 180) / Math.PI).toFixed(2),
      theta2: ((ikTheta2 * 180) / Math.PI).toFixed(2),
    });
  }, [theta1, theta2, targetX, targetY, L1, L2]);

  return (
    <div className="container">
      <h1 className="title">Robotics Kinematics Comparisons</h1>
      <div className="flex-container">
        <div className="canvas-container">
          <canvas ref={canvasRef} width={600} height={600} className="canvas" />
        </div>
        <div className="controls-container">
          <div className="card">
            <h2>Forward Kinematics</h2>
            <div className="slider-container">
              <label>θ1: {theta1}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={theta1}
                onChange={(e) => setTheta1(Number(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>θ2: {theta2}°</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={theta2}
                onChange={(e) => setTheta2(Number(e.target.value))}
              />
            </div>
            <div className="result">
              <strong>End Effector Position:</strong>
              <p>
                X: {endEffectorPosition.x}, Y: {endEffectorPosition.y}
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Inverse Kinematics</h2>
            <div className="slider-container">
              <label>Target X: {targetX}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={targetX}
                onChange={(e) => setTargetX(Number(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>Target Y: {targetY}</label>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={targetY}
                onChange={(e) => setTargetY(Number(e.target.value))}
              />
            </div>
            <div className="result">
              <strong>Calculated Angles:</strong>
              <p>
                θ1: {calculatedAngles.theta1}°, θ2: {calculatedAngles.theta2}°
              </p>
            </div>
          </div>

          <div className="card">
            <h2>Arm Lengths</h2>
            <div className="slider-container">
              <label>L1: {L1}</label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={L1}
                onChange={(e) => setL1(Number(e.target.value))}
              />
            </div>
            <div className="slider-container">
              <label>L2: {L2}</label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.1"
                value={L2}
                onChange={(e) => setL2(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KinematicsVisualization;
