import React, { useState } from "react";
import axios from "axios";

import HidatoCell from "./HidatoCell";

let URL = "http://hidato.herokuapp.com/solve";

function generateInitialPoints() {
  const pointRangeForEveryRow = [
    { startX: 0, endX: 4 },
    { startX: 0, endX: 4 },
    { startX: 0, endX: 5 },
    { startX: 0, endX: 5 },
    { startX: 0, endX: 6 },
    { startX: 2, endX: 6 },
    { startX: 4, endX: 7 },
    { startX: 6, endX: 7 }
  ];
  return pointRangeForEveryRow.map(({ startX, endX }, row) =>
    new Array(8).fill(0).map((_, col) => ({
      row: row,
      col: col,
      visible: col >= startX && col <= endX,
      val: "",
      fromInput: false
    }))
  );
}

function getSetOfInputtedValues(points) {
  return new Set(points.map(point => point.val));
}

async function solveHidato(points) {
  function getNonEmptyVisiblePoints(points) {
    return points.reduce((prev, curr) => {
      const nonEmptyVisiblePoints = curr.filter(point => {
        return point.visible && point.val != "";
      });
      return prev.concat(
        nonEmptyVisiblePoints.map(point => ({
          row: point.row + 1, // 1-indexed in back end
          col: point.col + 1, // 1-indexed in back end
          val: Number(point.val)
        }))
      );
    }, []);
  }

  const spec = getNonEmptyVisiblePoints(points);

  const uniqueValues = getSetOfInputtedValues(spec);

  let valid = true;
  if (uniqueValues.size !== spec.length) {
    window.alert("Input should be unique. There is duplicate element");
    valid = false;
  }

  spec.sort((a, b) => a.val - b.val);

  if (spec.length < 15) {
    window.alert("You should provide a minimum of 15 numbers");
    valid = false;
  }

  if (spec[0].val !== 1 || spec[spec.length - 1].val !== 40) {
    window.alert("Please input 1 and 40");
    valid = false;
  }

  if (!valid) return points;

  try {
    const response = await axios.post(URL, spec, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token"
      }
    });
    console.log("Get response: ");
    console.log(response);
    const mat = new Array(8).fill(0).map(() => new Array(8).fill(0));
    response.data.forEach((point, i) => {
      mat[point.row - 1][point.col - 1] = point.val;
    });

    console.log(mat);
    console.log(points);
    points = points.map(row =>
      row.map(point => ({
        ...point,
        val: mat[point.row][point.col]
      }))
    );
    return points;
  } catch (e) {
    window.alert("Error: " + e);
    return points;
  }
}

function HidatoGrid() {
  const [points, setState] = useState(generateInitialPoints());
  return (
    <React.Fragment>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 2.5rem)",
          gridTemplateRows: "repeat(8, 2.5rem)"
        }}
      >
        {points.reduce(
          (prev, curr) =>
            prev.concat(
              curr.map(cell => (
                <HidatoCell
                  key={`hidato-cell-${cell.row}-${cell.col}`}
                  callback={newVal => {
                    const newPoints = points.map((row, r) =>
                      r !== cell.row
                        ? row
                        : row.map((col, c) =>
                            c !== cell.col
                              ? col
                              : {
                                  ...col,
                                  val: newVal,
                                  fromInput: true
                                }
                          )
                    );
                    setState(newPoints);
                  }}
                  {...cell}
                />
              ))
            ),
          []
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          marginTop: "1rem"
        }}
      >
        <button
          onClick={async () => {
            let newPoints = await solveHidato(points, setState);
            setState(newPoints);
          }}
        >
          Solve
        </button>
        <button
          style={{ marginLeft: "1rem" }}
          onClick={() => setState(generateInitialPoints())}
        >
          Clear
        </button>
      </div>
    </React.Fragment>
  );
}

export default HidatoGrid;
