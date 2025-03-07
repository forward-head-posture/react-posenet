import React, { useRef, useState, useEffect } from "react"
import PropTypes from "prop-types"
import Loading from "./Loading"
import useInputImage from "../hooks/useInputImage"
import useNet from "../hooks/useLoadNet"

function ForwardHeadPosture({
  style,
  className,
  facingMode,
  frameRate,
  input,
  onEstimate,
  width,
  height
}) {
  const [ctx, setCtx] = useState()
  const [errorMessage, setErrorMessage] = useState()
  const onEstimateRef = useRef()
  onEstimateRef.current = onEstimate
  const net = useNet()
  const image = useInputImage({
    input,
    width,
    height,
    facingMode,
    frameRate
  })

  useEffect(() => {
    if (!net || !image || !ctx) return () => {}
    if ([net, image].some(elem => elem instanceof Error)) return () => {}

    let intervalId
    let requestId
    function cleanUp() {
      clearInterval(intervalId)
      cancelAnimationFrame(requestId)
    }

    async function estimate() {
      try {
        ctx.scale(-1, 1)
        ctx.drawImage(image, 0, 0, width * -1, height)
        const score = await net.estimate(image)
        onEstimateRef.current(score)
      } catch (err) {
        cleanUp()
        setErrorMessage(err.message)
      }
    }

    if (frameRate) {
      intervalId = setInterval(estimate, Math.round(1000 / frameRate))
      return cleanUp
    }

    function animate() {
      estimate()
      requestId = requestAnimationFrame(animate)
    }
    requestId = requestAnimationFrame(animate)

    return cleanUp
  }, [ctx, frameRate, height, image, net, width])
  return (
    <>
      <Loading name="model" target={net} />
      <Loading name="input" target={image} />
      <font color="red">{errorMessage}</font>
      <canvas
        style={style}
        className={className}
        ref={c => {
          if (c) {
            setCtx(c.getContext("2d"))
          }
        }}
        width={width}
        height={height}
      />
    </>
  )
}

ForwardHeadPosture.propTypes = {
  /** canvas style */
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
  /** canvas className */
  className: PropTypes.string,
  /** @see https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/facingMode  */
  facingMode: PropTypes.string,
  /** First of all frameRate is parameter of [getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
   *  see [MediaTrackConstraints.frameRate](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/frameRate)
   *  <br/>
   *  Second frameRate affects how often estimation occurs. react-forward-head-posture internally do <br/>
   *  [setInterval](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval)(() => { estimatePose() } , (1000 / framerate))
   *  to estimate image continuously. <br/>
   *  If frameRate is undefined react-forward-head-posture use [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) */
  frameRate: PropTypes.number,
  /**
   * the input image to feed through the network. <br/>
   * If input is not specified react-forward-head-posture try to [getUserMedia](https:/developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)<br/>
   */
  input: PropTypes.element,
  /**
   * gets called after estimation. score is a passed parameter
   */
  onEstimate: PropTypes.func,
  width: PropTypes.number,
  /** canvas height */
  height: PropTypes.number
}

ForwardHeadPosture.defaultProps = {
  style: {},
  className: "",
  facingMode: "user",
  frameRate: 20,
  input: undefined,
  onEstimate: () => {},
  width: 600,
  height: 500
}

export default ForwardHeadPosture
