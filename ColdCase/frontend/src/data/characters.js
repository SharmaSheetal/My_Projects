import julianImg from "../assets/characters/julian.png";
import victorImg from "../assets/characters/victor.png";
import marthaImg from "../assets/characters/martha.png";
import roseImg from "../assets/characters/rose.png";
import hayesImg from "../assets/characters/hayes.png";
import collinsImg from "../assets/characters/DrCollins.jpeg";

export const CHARACTER_DATA = {
    julian: {
        name: "Julian Byte",
        role: "Star Judge",
        image: julianImg,
        border: "border-purple-400/30",
    },
    victor: {
        name: "Victor Vale",
        role: "Founder",
        image: victorImg,
        border: "border-blue-400/30",
    },
    martha: {
        name: "Martha Keen",
        role: "Operations Lead",
        image: marthaImg,
        border: "border-emerald-400/30",
    },
    rose: {
        name: "Rose Voss",
        role: "VIP Coordinator",
        image: roseImg,
        border: "border-pink-400/30",
    },
    hayes: {
        name: "Detective Hayes",
        role: "Investigator",
        image: hayesImg,
        border: "border-amber-400/30",
    },
    dr_collins: {
        name: "Dr. Collins",
        role: "Medical Staff",
        image: collinsImg,
        border: "border-emerald-400/30",
    },
};