import React, { useState } from "react";
import goal1 from "../../../../../assets/image/METER/1- LOW.png";
import goal2 from "../../../../../assets/image/METER/2-Moderately Low.png";
import goal3 from "../../../../../assets/image/METER/3- Moderate.png";
import goal4 from "../../../../../assets/image/METER/4- Moderately high.png";
import goal5 from "../../../../../assets/image/METER/5-  High.png";
import goal6 from "../../../../../assets/image/METER/6- Very High.png";
import { Button, Col, Divider, Row } from "antd";
import useTitleBlock from "../../../../../hooks/useTitleBlock";
import { IoCloseOutline } from "react-icons/io5";
import { GoArrowRight } from "react-icons/go";
import TextArea from "antd/es/input/TextArea";

const RiskGoals = ({ modalData }) => {
  const { onGoalChange } = modalData;
  const renderTitleBlock = useTitleBlock();

  const [selectedGoal, setSelectedGoal] = useState(
    modalData?.participant?.riskGoal,
  );
  const [riskDescription, setRiskDescription] = useState(
    modalData?.participant?.riskDescription,
  );
  const [addNoteDescription, setAddNoteDescription] = useState(
    modalData?.participant?.addNoteDescription,
  );

  const Profiles = {
    "Cash Management": {
      title: "Cash Management",
      description:
        "Your responses indicate an extremely low tolerance to investment risk or, alternatively, you have a short investment time frame. The only appropriate investment for this risk profile or time frame is a cash-based investment such as bank accounts, cash management trusts and term deposits.",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.007999999999996"
            x2="105.72614131981837"
            y2="41.80800000000001"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.80799999999999"
            x2="60"
            y2="15.408000000000001"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.800000000000004"
            y1="40.14877691738418"
            x2="33.60000000000001"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.007999999999996"
            x2="14.27385868018164"
            y2="41.80800000000001"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="15.648000000000003,68.208 60,70.608 64.8,68.208 60,65.80799999999999"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
    Conservative: {
      title: "Conservative",
      description:
        "As a Conservative investor, you really don't like risk. Your risk profile suggests you are most concerned with keeping what you have. As a result, you are prepared to accept lower returns to reduce the risk of losing capital. Based on your risk profile you would generally prefer an investment mix that is positioned defensively to produce a stable return with a higher proportion invested in bonds and cash and a smaller proportion of money in shares and property investments. Minimum Investment Term: 2 years",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.008"
            x2="105.72614131981837"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.808"
            x2="60"
            y2="15.408"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.8"
            y1="40.14877691738418"
            x2="33.6"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.008"
            x2="14.27385868018164"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="24.118478265482338,42.138548490324226 58.589315394498065,70.14964078649987 63.88328157299975,71.02936921100387 61.410684605501935,66.26635921350012"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
    "Moderately Conservative": {
      title: "Moderately Conservative",
      description:
        "As a Moderately Conservative investor, you seek consistent returns using a steady growth strategy. Your risk profile suggests you want some potential for capital growth, but prefer not to have large fluctuations in short term performance. Based on your risk profile, you would generally prefer a diversified portfolio with a balance of defensive assets, such as bonds and cash and growth assets such as shares and property. Minimum Investment Term: 3 years",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.008"
            x2="105.72614131981837"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.808"
            x2="60"
            y2="15.408"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.8"
            y1="40.14877691738418"
            x2="33.6"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.008"
            x2="14.27385868018164"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="46.29447826548234,26.026741389277348 57.71746436089163,68.94964078649987 61.48328157299974,72.77307127821673 62.28253563910837,67.46635921350013"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
    Balanced: {
      title: "Balanced",
      description:
        "As a Balanced investor, you seek a portfolio that will give you the best opportunity to achieve your medium to long term financial goals. Your risk profile suggests you are prepared to experience short term fluctuations in performance for potentially higher returns over the long term. Based on your risk profile, you would generally prefer a diversified portfolio with a bias towards growth assets such as shares and property. Minimum Investment Term: 5 years",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.008"
            x2="105.72614131981837"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.808"
            x2="60"
            y2="15.408"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.8"
            y1="40.14877691738418"
            x2="33.6"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.008"
            x2="14.27385868018164"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="73.70552173451767,26.026741389277355 57.71746436089163,67.46635921350013 58.51671842700025,72.77307127821673 62.28253563910837,68.94964078649987"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
    Growth: {
      title: "Growth",
      description:
        "As a Growth investor, you focus on assets with greater growth potential. Your risk profile suggests you are prepared to accept short term fluctuations in performance for potentially greater returns over the longer term. Based on your risk profile, you would generally prefer a diversified portfolio with a strong bias towards growth investments such as shares and property. Minimum Investment Term: 5 years",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.008"
            x2="105.72614131981837"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.808"
            x2="60"
            y2="15.408"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.8"
            y1="40.14877691738418"
            x2="33.6"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.008"
            x2="14.27385868018164"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="95.88152173451766,42.13854849032423 58.589315394498065,66.26635921350012 56.11671842700025,71.02936921100387 61.410684605501935,70.14964078649987"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
    "High Growth": {
      title: "High Growth",
      description:
        "As a High Growth investor, you are prepared to compromise portfolio balance to pursue potential long-term gains. Your risk profile suggests you acknowledge there will be short term fluctuations in performance and are comfortable to invest in high risk investments. Based on your risk profile you would generally prefer a portfolio comprising solely growth assets such as shares and property. Minimum Investment Term: 7 years.",
      color: "rgb(34, 197, 94)",
      svg: (
        <svg
          width="120"
          height="69.6"
          viewBox="0 0 120 69.6"
          style={{ overflow: "visible", display: "block" }}
        >
          <path
            d="M7.201286698755162,67.8393894562676 A52.8,52.8 0 0,0 14.090667722124437,42.127869444352605 L31.8283642840309,52.20428352267091 A32.400000000000006,32.400000000000006 0 0,1 27.600789565145206,67.98180716634603 Z"
            fill="#22c55e"
          ></path>
          <path
            d="M14.45927826585681,41.489417254402554 A52.8,52.8 0 0,0 33.28141725440254,22.667278265856815 L43.604506042474284,40.26255711768486 A32.400000000000006,32.400000000000006 0 0,1 32.05455711768485,51.81250604247429 Z"
            fill="#8bc34a"
          ></path>
          <path
            d="M33.919869444352614,22.298667722124435 A52.8,52.8 0 0,0 59.631389456267634,15.40928669875516 L59.773807166346046,35.808789565145204 A32.400000000000006,32.400000000000006 0 0,1 43.99628352267092,40.036364284030896 Z"
            fill="#cddc39"
          ></path>
          <path
            d="M60.36861054373237,15.40928669875516 A52.8,52.8 0 0,0 86.0801305556474,22.298667722124435 L76.00371647732909,40.036364284030896 A32.400000000000006,32.400000000000006 0 0,1 60.226192833653954,35.808789565145204 Z"
            fill="#ffc107"
          ></path>
          <path
            d="M86.71858274559744,22.667278265856808 A52.8,52.8 0 0,0 105.54072173414319,41.489417254402554 L87.94544288231515,51.81250604247429 A32.400000000000006,32.400000000000006 0 0,1 76.3954939575257,40.26255711768485 Z"
            fill="#ff7043"
          ></path>
          <path
            d="M105.90933227787556,42.12786944435261 A52.8,52.8 0 0,0 112.79871330124485,67.83938945626763 L92.3992104348548,67.98180716634604 A32.400000000000006,32.400000000000006 0 0,1 88.1716357159691,52.20428352267091 Z"
            fill="#f44336"
          ></path>
          <line
            x1="88.05922308261582"
            y1="52.008"
            x2="105.72614131981837"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="76.2"
            y1="40.14877691738418"
            x2="86.4"
            y2="22.481858680181645"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="60"
            y1="35.808"
            x2="60"
            y2="15.408"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="43.8"
            y1="40.14877691738418"
            x2="33.6"
            y2="22.481858680181638"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <line
            x1="31.94077691738418"
            y1="52.008"
            x2="14.27385868018164"
            y2="41.808"
            stroke="#fff"
            strokeWidth="1.8"
          ></line>
          <polygon
            points="104.352,68.208 60,65.808 55.2,68.208 60,70.608"
            fill="#1f2937"
          ></polygon>
          <circle cx="60" cy="68.208" r="6.24" fill="#1f2937"></circle>
          <circle cx="60" cy="68.208" r="3.36" fill="#22c55e"></circle>
        </svg>
      ),
    },
  };

  const profile = Profiles[modalData?.participant?.riskGoal];

  if (modalData?.participant?.riskGoal !== selectedGoal) {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          {renderTitleBlock({
            title: "Change Risk Profile",
            titleStyle: {
              fontSize: "16px",
              fontWeight: "600",
              color: "rgb(17, 24, 39)",
            },
            clossButton: true,
            onClose: () => modalData?.closeModal?.(),
            isEditing: true,
          })}
          <Divider style={{ margin: "12px 0px 0px 0px" }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
            padding: "12px 16px",
            background: "rgb(249, 250, 251)",
            borderRadius: "10px",
            border: "1px solid rgb(229, 231, 235)",
          }}
        >
          <div
            style={{
              flex: "1 1 0%",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontFamily: "Arial",
                fontSize: "10px",
                color: "rgb(156, 163, 175)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              FROM
            </span>
            <span
              style={{
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: "700",
                color: "rgb(55, 65, 81)",
              }}
            >
              {modalData?.participant?.riskGoal}
            </span>
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "rgb(34, 197, 94)",
            }}
          >
            <GoArrowRight size={20} />
          </div>
          <div
            style={{
              flex: "1 1 0%",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontFamily: "Arial",
                fontSize: "10px",
                color: "rgb(156, 163, 175)",
              }}
            >
              TO
            </span>
            <span
              style={{
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: "700",
                color: "rgb(22, 163, 74)",
              }}
            >
              {selectedGoal}
            </span>
          </div>
        </div>

        <Row>
          <Col xs={24} md={24} lg={24}>
            <label
              style={{
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgb(17, 24, 39)",
              }}
              className="mb-1"
            >
              Please provide a reason/description of why you are changing the
              Risk Profile:{" "}
            </label>
            <TextArea
              style={{
                width: "100%",
                border: "1.5px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "9px",
                padding: "10px 13px",
                fontFamily: "Arial",
                fontSize: "13px",
                color: "rgb(55, 65, 81)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                background: "rgb(250, 255, 254)",
              }}
              rows={4}
              value={riskDescription}
              onChange={(e) => {
                setRiskDescription(e.target.value);
              }}
            />
          </Col>
          <Col xs={24} md={24} lg={24} className="mt-3">
            <label
              style={{
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgb(17, 24, 39)",
              }}
              className="mb-1"
            >
              Add Note
            </label>
            <TextArea
              rows={4}
              value={addNoteDescription}
              onChange={(e) => {
                setAddNoteDescription(e.target.value);
              }}
              style={{
                width: "100%",
                border: "1.5px solid rgba(34, 197, 94, 0.4)",
                borderRadius: "9px",
                padding: "10px 13px",
                fontFamily: "Arial",
                fontSize: "13px",
                color: "rgb(55, 65, 81)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                background: "rgb(250, 255, 254)",
              }}
            />
          </Col>
          <Col
            xs={24}
            md={24}
            lg={24}
            className="mt-3 d-flex justify-content-end align-items-center gap-2"
          >
            <Button
              onClick={() => {
                modalData?.closeModal?.();
              }}
              style={{
                padding: "17px 24px",
                borderWidth: "medium",
                borderStyle: "none",
                borderColor: "currentcolor",
                borderImage: "initial",
                borderRadius: "10px",
                background: "rgb(75, 85, 99)",
                color: "rgb(255, 255, 255)",
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "rgba(75, 85, 99, 0.3) 0px 3px 12px",
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              style={{
                padding: "17px 24px",
                borderWidth: "medium",
                borderStyle: "none",
                borderColor: "currentcolor",
                borderImage: "initial",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))",
                color: "rgb(255, 255, 255)",
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "rgba(34, 197, 94, 0.3) 0px 3px 12px",
              }}
              onClick={() => {
                onGoalChange(
                  modalData?.participantKey,
                  selectedGoal,
                  riskDescription,
                  addNoteDescription,
                );
                modalData?.closeModal?.();
              }}
            >
              Submit
            </Button>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between position-relative">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "start",
            justifyContent: "start",
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "Arial",
              fontSize: "10px",
              letterSpacing: "2px",
              color: "rgb(34, 197, 94)",
              textTransform: "uppercase",
            }}
          >
            Risk Profile{" "}
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "20px",
              fontWeight: "700",
              color: "rgb(17, 24, 39)",
            }}
          >
            {" "}
            {modalData?.participantName} — Select Profile
          </div>
        </div>
        <div>
          <Button
            className="ModalCloseButtonHover"
            onClick={() => {
              modalData?.closeModal?.();
            }}
          >
            <IoCloseOutline size={25} />
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px 15px",
          marginTop: "16px",
        }}
      >
        {Object.values(Profiles).map((profile) => (
          <div
            key={profile.title}
            onClick={() => {
              setRiskDescription(profile.description);
              setSelectedGoal(profile.title);
            }}
            style={{
              width: "200px",
              height: "150px",
              borderRadius: 14,
              border:
                profile.title === selectedGoal
                  ? "2px solid rgb(34, 197, 94, 0.25)"
                  : "2px solid rgb(229, 231, 235)",
              background:
                profile.title === selectedGoal
                  ? "rgb(34, 197, 94, 0.07)"
                  : "rgb(255, 255, 255)",
              padding: "18px 14px;",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {profile.svg}

            <div
              style={{
                fontFamily: "Arial",
                fontSize: "13px",
                fontWeight: "700",
                color: "rgb(55, 65, 81)",
              }}
            >
              {" "}
              {profile.title}
            </div>
            {profile.title === selectedGoal && (
              <div
                style={{
                  background: `rgb(34, 197, 94)`,
                  color: "#fff",
                  padding: "4px ",
                  borderRadius: 4,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <Row>
        <Col xs={24} md={24} lg={24} className="mt-3">
          <div
            style={{
              padding: "14px 18px",
              background: "rgb(249, 250, 251)",
              borderRadius: "12px",
              border: "1px solid rgb(229, 231, 235)",
              marginBottom: "16px",
              fontFamily: "Arial",
              fontSize: "12px",
              color: "rgb(107, 114, 128)",
              lineHeight: "1.65",
            }}
          >
            {modalData?.participant?.riskDescription}
          </div>
        </Col>
        <Col xs={24} lg={24} className="d-flex">
          <Button
            type="primary"
            className="w-100"
            onClick={() => {
              modalData?.closeModal?.();
            }}
            style={{
              width: "100%",
              padding: "13px",
              borderWidth: "medium",
              borderStyle: "none",
              borderColor: "currentcolor",
              borderImage: "initial",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, rgb(34, 197, 94), rgb(22, 163, 74))",
              color: "rgb(255, 255, 255)",
              fontFamily: "Arial",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "rgba(34, 197, 94, 0.3) 0px 3px 12px",
              height: "46px",
            }}
          >
            Close
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default RiskGoals;
