// Dados completos das 57 OLL com 4 variantes cada
const ollDataExpanded = [
    {
        "number": 1,
        "name": "OLL 1",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll1_5eb853a3-0083-449b-820a-c396bd96773a_200x.png?v=1704584898",
        "algorithms": [
            "R U2 R2 F R F' U2 R' F R F'",
            "R U2 R' U' R U R' U' R U' R'",
            "r U2 R' U' R U' r'",
            "R U B' R B R2 U' R' F R F'"
        ]
    },
    {
        "number": 2,
        "name": "OLL 2",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll2_04016b00-c19f-4e62-8751-2f22968748e0_200x.png?v=1704584900",
        "algorithms": [
            "r U R' U' r' F R F'",
            "F R U R' U' F' f R U R' U' f'",
            "R U R' U R U' R' U R U2 R'",
            "r U R' U' M' U R U' R'"
        ]
    },
    {
        "number": 3,
        "name": "OLL 3",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll3_0bb55b60-bcde-4427-b2d6-595f01540405_200x.png?v=1704584434",
        "algorithms": [
            "F R U R' U' F'",
            "r' R U R U R' U' r R2 F R F'",
            "R U R' U R U2 R'",
            "F U R U' R' F'"
        ]
    },
    {
        "number": 4,
        "name": "OLL 4",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll4_11e77a19-0f55-4827-87f3-8de35f2d30ac_200x.png?v=1704586335",
        "algorithms": [
            "Fw R U R' U' Fw'",
            "F U R U' R' F'",
            "R U R' U' R' F R F'",
            "f R U R' U' f'"
        ]
    },
    {
        "number": 5,
        "name": "OLL 5",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll5_81b44bc9-4a82-44ff-94d8-873a9586986f_200x.png?v=1704585891",
        "algorithms": [
            "r' U2 R U R' U r",
            "l' U2 L U L' U l",
            "R' F R U R' U' F' U R",
            "r' R2 U R' U r U2 r' U M'"
        ]
    },
    {
        "number": 6,
        "name": "OLL 6",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll6_2d865357-df5c-48c0-9ad4-1b3005b558bc_200x.png?v=1704585888",
        "algorithms": [
            "r U2 R' U' R U' r'",
            "r' R U R U R' U' M' U R' U' R",
            "R B' R' U' R U B U' R'",
            "l' U' L U' L' U2 l"
        ]
    },
    {
        "number": 7,
        "name": "OLL 7",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll7_60502787-da8e-43a3-b863-5ef8c7033c26_200x.png?v=1704585352",
        "algorithms": [
            "r U R' U R U2 r'",
            "R' U' F U R U' R' F' R",
            "l U L' U L U2 l'",
            "r U r' U R U' R' U R U2 r'"
        ]
    },
    {
        "number": 8,
        "name": "OLL 8",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll8_f3911448-8081-45b1-8f8a-3730786d1857_200x.png?v=1704586201",
        "algorithms": [
            "r' U' R U' R' U2 r",
            "R U B' U' R' U R B R'",
            "l' U' L U' L' U2 l",
            "M' U' r U' R' U2 r' U r"
        ]
    },
    {
        "number": 9,
        "name": "OLL 9",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll9_dbfae90e-52db-4fa5-a443-f1c3a69a5aee_200x.png?v=1704586111",
        "algorithms": [
            "R U R' U' R' F R2 U R' U' F'",
            "R U R' U R' F R F' R U2 R'",
            "F' L' U' L U L' U' L U F",
            "R U2 R2 F R F' U2 M' U R U' r'"
        ]
    },
    {
        "number": 10,
        "name": "OLL 10",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll10_57b5a01a-4703-4a4c-8a47-895c7b819be0_200x.png?v=1704584160",
        "algorithms": [
            "R U R' U R' F R F' R U2 R'",
            "R U R' U' R' F R2 U R' U' F'",
            "R' U' R U' R' U R' F R F' U R",
            "r' R U R U R' U' r R2 F R F'"
        ]
    },
    {
        "number": 11,
        "name": "OLL 11",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll11_bc51814c-97f7-4ab2-97fe-d748586a1403_200x.png?v=1704584626",
        "algorithms": [
            "r U R' U R' F R F' R U2 r'",
            "M R U R' U R U2 r'",
            "r' R2 U R' U R U2 R' U M'",
            "r U R' U R U' R' U R U2 r'"
        ]
    },
    {
        "number": 12,
        "name": "OLL 12",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll12_e3ca8475-74f7-40ac-902c-9437c124025f_200x.png?v=1704584252",
        "algorithms": [
            "M' R' U' R U' R' U2 R U' M",
            "r' R2 U' R U' R' U2 R U' r",
            "F R U R' U' F' U F R U R' U' F'",
            "r R' U R U R' U' r' R U R U R'"
        ]
    },
    {
        "number": 13,
        "name": "OLL 13",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll13_999f7d28-7a15-4a97-99ff-ecf4008ecac0_200x.png?v=1704585246",
        "algorithms": [
            "r U' r' U' r U r' F' U F",
            "F U R U' R2 F' R U R U' R'",
            "r U' r2 U r2 U r2 U' r",
            "r U r' U r U' r' F' U' F"
        ]
    },
    {
        "number": 14,
        "name": "OLL 14",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll14_81cb5366-b828-4000-bbfa-e897e313b755_200x.png?v=1704585342",
        "algorithms": [
            "R' F R U R' F' R F U' F'",
            "r' U r U r' U' r F U' F'",
            "R' U' R' F R F' U R",
            "r' U' r U' r' U r F U F'"
        ]
    },
    {
        "number": 15,
        "name": "OLL 15",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll15_f86f7a5e-81ca-4d0d-bfd7-63e85b2a8db0_200x.png?v=1704585856",
        "algorithms": [
            "r' U' r R' U' R U r' U r",
            "l' U' l L' U' L U l' U l",
            "R' F' U' F U' R U R' U R",
            "r' U' M' U' R U r' U r"
        ]
    },
    {
        "number": 16,
        "name": "OLL 16",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll16_72fd0eaf-5bb8-42ad-a00f-a8f9b3bd02ce_200x.png?v=1704584510",
        "algorithms": [
            "r U r' R U R' U' r U' r'",
            "l U l' L U L' U' l U' l'",
            "R B U B' U R' U' R U' R'",
            "r U M U R' U' r U' r'"
        ]
    },
    {
        "number": 17,
        "name": "OLL 17",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll17_f0c3d1ad-c777-4ed8-a652-f7cbe525c2ae_200x.png?v=1704585662",
        "algorithms": [
            "R U R' U R' F R F' U2 R' F R F'",
            "F R' F' R2 r' U R U' R' U' M'",
            "r U R' U R U2 r2 U' R U' R' U2 r",
            "R U R' U R' F R F' R U2 R'"
        ]
    },
    {
        "number": 18,
        "name": "OLL 18",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll18_e6fc5058-9a8d-4182-9759-e8d8b57bc126_200x.png?v=1704585288",
        "algorithms": [
            "r U R' U R U2 r2 U' R U' R' U2 r",
            "R U2 R2 F R F' U2 M' U R U' r'",
            "F R U R' d R' U2 R' F R F'",
            "r U R' U r' R U R U2 R'"
        ]
    },
    {
        "number": 19,
        "name": "OLL 19",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll19_e20cadc3-5df9-44a4-ae4a-1db74a54a54f_200x.png?v=1704585679",
        "algorithms": [
            "r' R U R U R' U' M' R' F R F'",
            "M U R U R' U' M' R' F R F'",
            "r U R' U' M2 U R U' R' U' M'",
            "R' U2 F R U R' U' F2 U2 F R"
        ]
    },
    {
        "number": 20,
        "name": "OLL 20",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll20_9068152d-aabc-4332-b692-8e5cff2f1560_200x.png?v=1704585144",
        "algorithms": [
            "r U R' U' M2 U R U' r'",
            "M U R U R' U' M2 U R U' r'",
            "r' U' R U' R' U2 r2 U R' U R U2 r'",
            "R' U' F' U F R U M U R' U' r"
        ]
    },
    {
        "number": 21,
        "name": "OLL 21",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll21_4133c9f1-a90f-427c-a681-a20ab1b0022e_200x.png?v=1734676730",
        "algorithms": [
            "R U2 R' U' R U R' U' R U' R'",
            "R U R' U R U' R' U R U2 R'",
            "F R U R' U' R U R' U' F'",
            "R U2 R2 U' R2 U' R2 U2 R"
        ]
    },
    {
        "number": 22,
        "name": "OLL 22",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll22_520x500_1dd23233-832a-4cf3-ba47-00a2a3ea5f35_200x.png?v=1734676800",
        "algorithms": [
            "R U2 R2 U' R2 U' R2 U2 R",
            "R U2 R' U' R U' R2 U2 R U R' U R",
            "F R U R' U' R U R' U' F'",
            "r U R' U' r' F R2 U R' U' F'"
        ]
    },
    {
        "number": 23,
        "name": "OLL 23",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll23_163ed1ce-e800-423c-aba3-29da08053c92_200x.png?v=1704584603",
        "algorithms": [
            "R2 D R' U2 R D' R' U2 R'",
            "R2 D' R U2 R' D R U2 R",
            "r2 D' r U2 r' D r U2 r",
            "R' U2 R F U' R' U' R U F'"
        ]
    },
    {
        "number": 24,
        "name": "OLL 24",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll24_2d0baecd-e4aa-4ae8-a68e-46fe118304e6_200x.png?v=1704585495",
        "algorithms": [
            "r U R' U' r' F R F'",
            "L F R' F' L' F R F'",
            "r U R' U' M' U R U' R'",
            "x' U R' U' L U R U' r'"
        ]
    },
    {
        "number": 25,
        "name": "OLL 25",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll25_d917c3ac-6651-48dc-a82d-2f252cb1b6dc_200x.png?v=1704585155",
        "algorithms": [
            "F' r U R' U' r' F R",
            "x' R U' R' F U R U' R' F' R U R' U' x",
            "R' F R B' R' F' R B",
            "F' L F R' F' L' F R"
        ]
    },
    {
        "number": 26,
        "name": "OLL 26",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll26_04a32d53-a35a-48ee-bf98-02c2b32d87bd_200x.png?v=1704585286",
        "algorithms": [
            "R U2 R' U' R U' R'",
            "R' U' R U' R' U2 R",
            "R U R' U R U2 R'",
            "l U' R U l' U' R'"
        ]
    },
    {
        "number": 27,
        "name": "OLL 27",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll27_67ab6648-4727-47ab-8db7-250354faeab3_200x.png?v=1704584596",
        "algorithms": [
            "R U R' U R U2 R'",
            "R' U2 R U R' U R",
            "L' U2 L U L' U L",
            "r' U r U' r' U2 r"
        ]
    },
    {
        "number": 28,
        "name": "OLL 28",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll28_c5a90efe-bf95-47b3-bac9-4a1581085906_200x.png?v=1704585844",
        "algorithms": [
            "r U R' U' r' R U R U' R'",
            "M U R U R' U' M' R' F R F'",
            "r U R' U' M' U R U' R'",
            "R U R' U' R U' R' F' U' F R U R'"
        ]
    },
    {
        "number": 29,
        "name": "OLL 29",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll29_325b0d97-d8a6-4551-9043-5f7d2cb77f53_200x.png?v=1704584176",
        "algorithms": [
            "R U R' U' R U' R' F' U' F R U R'",
            "M U R U R' U' M2 U R U' r'",
            "F R' F R2 U' R' U' R U R' F2",
            "r' R2 U R' U R U2 R' U M'"
        ]
    },
    {
        "number": 30,
        "name": "OLL 30",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll30_4b817145-bf55-4218-90dd-7441427a695a_200x.png?v=1704585366",
        "algorithms": [
            "F U R U2 R' U' R U R' F'",
            "r U r' U' r' R U R U' R' U M'",
            "F R' F R2 U R' U' F2 U F",
            "R' U' F U R U' R' F' R"
        ]
    },
    {
        "number": 31,
        "name": "OLL 31",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll31_ba588f7c-d19f-4dd0-909e-e147538d9aaa_200x.png?v=1704585444",
        "algorithms": [
            "R' U' F U R U' R' F' R",
            "L' U' B U L U' L' B' L",
            "r' U' F U R U' r' F' R",
            "S' L' U' L U L F' L' f"
        ]
    },
    {
        "number": 32,
        "name": "OLL 32",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll32_c57d8496-b633-47da-ba02-d9248f2a6ea4_200x.png?v=1704585380",
        "algorithms": [
            "R U B' U' R' U R B R'",
            "L U F' U' L' U L F L'",
            "S R U R' U' R' F R f'",
            "r U B' U' r' U r B r'"
        ]
    },
    {
        "number": 33,
        "name": "OLL 33",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll33_b0b04ec5-7e61-4b5e-a4bd-871af9b4a2b3_200x.png?v=1704584633",
        "algorithms": [
            "R U R' U' R' F R F'",
            "F U R U' R' F'",
            "R' U' R U' R' U R U F R' F' R",
            "L' U' L U' L' U L U F L' F' L"
        ]
    },
    {
        "number": 34,
        "name": "OLL 34",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll34_24dec5b4-43d9-456c-b3d5-f7d7772d9720_200x.png?v=1704584237",
        "algorithms": [
            "R U R2 U' R' F R U R U' F'",
            "R U R' U' B' R' F R F' B",
            "F R' F' R U R U' R'",
            "r' R2 U R' U R U2 R' U r"
        ]
    },
    {
        "number": 35,
        "name": "OLL 35",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll35_200x.png?v=1734676867",
        "algorithms": [
            "R U2 R' U2 R' F R F'",
            "R U2 R2 F R F' U2 R' F R F'",
            "R' U' R U' R' U R U R B' R' B",
            "R U2 R' R' F R F' U2 R' F R F'"
        ]
    },
    {
        "number": 36,
        "name": "OLL 36",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll36_58362c72-3883-40aa-bde2-959fa968a367_200x.png?v=1704586243",
        "algorithms": [
            "L' U' L U' L' U L U L F' L' F",
            "r' U' r U' r' U r U r B' r' B",
            "R' U' R U' R' U R U R B' R' B",
            "L U L' U L U' L' U' L' B L B'"
        ]
    },
    {
        "number": 37,
        "name": "OLL 37",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll37_fbd06acd-6537-466c-9f82-ae2b368f9ae4_200x.png?v=1704585452",
        "algorithms": [
            "F R U' R' U' R U R' F'",
            "F R' F' R U R U' R'",
            "R U R' U R U' R' F' U F",
            "L' U' L U' L' U L U F L' F' L"
        ]
    },
    {
        "number": 38,
        "name": "OLL 38",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll38_6a4066d9-65ca-462f-9e60-3b730e0fda8e_200x.png?v=1704585837",
        "algorithms": [
            "R U R' U R U' R' U' R' F R F'",
            "L U L' U L U' L' U' L' B L B'",
            "F R U R' U' R U R' U' F'",
            "R' U' R U' R' U R U R B' R' B"
        ]
    },
    {
        "number": 39,
        "name": "OLL 39",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll39_f86e5dcc-433d-45f2-ad87-274141cd44f1_200x.png?v=1704585730",
        "algorithms": [
            "L F' L' U' L U F U' L'",
            "R' F R U R' U' F' U R",
            "r U R' U R U2 r'",
            "R U R' F' U' F U R U2 R'"
        ]
    },
    {
        "number": 40,
        "name": "OLL 40",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll40_7de769ef-38da-458c-9c49-b59b85ba88c0_200x.png?v=1704584656",
        "algorithms": [
            "R' F R U R' U' F' U R",
            "L F' L' U' L U F U' L'",
            "r' U' R U' R' U2 r",
            "R' U' R F U F' U' R' U2 R"
        ]
    },
    {
        "number": 41,
        "name": "OLL 41",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll41_b845d376-2634-42ad-bdd7-bba26f0e5b79_200x.png?v=1704585126",
        "algorithms": [
            "R U R' U R U2 R' F R U R' U' F'",
            "R U' R' U2 R U R' U2 R U R'",
            "R U R' U R U' R' U R U2 R'",
            "R U2 R2 U' R2 U' R2 U2 R"
        ]
    },
    {
        "number": 42,
        "name": "OLL 42",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll42_e6a7326c-cc0c-4e1a-8eb2-cdd2f4b4ffcb_200x.png?v=1704584413",
        "algorithms": [
            "R' U' R U' R' U2 R F R U R' U' F'",
            "R' U R U2 R' U' R U2 R' U' R",
            "R' U' R U' R' U R U' R' U2 R",
            "R' U2 R2 U R2 U R2 U2 R'"
        ]
    },
    {
        "number": 43,
        "name": "OLL 43",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll43_88acd672-0334-47a4-b444-21b8da420a23_200x.png?v=1704585735",
        "algorithms": [
            "F' U' L' U L F",
            "R' U' F' U F R",
            "f' L' U' L U f",
            "B' U' R' U R B"
        ]
    },
    {
        "number": 44,
        "name": "OLL 44",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll44_2c962b5b-2ab8-4932-9999-17e8880b3ef1_200x.png?v=1704584171",
        "algorithms": [
            "F U R U' R' F'",
            "f R U R' U' f'",
            "L U F U' F' L'",
            "B U R U' R' B'"
        ]
    },
    {
        "number": 45,
        "name": "OLL 45",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll45_fa7918e5-bff1-42e9-9a92-f9a9f1e814b2_200x.png?v=1704585081",
        "algorithms": [
            "F R U R' U' F'",
            "R U R' U R U2 R' U' R U' R'",
            "L' B' L U' R' U R U' L' B L",
            "f R U R' U' f'"
        ]
    },
    {
        "number": 46,
        "name": "OLL 46",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll46_2eb2b39e-c173-4184-a8c2-cfec7fd5d4ff_200x.png?v=1704585798",
        "algorithms": [
            "R' U' R' F R F' U R",
            "R' U' R' F R F' R' F R F' U R",
            "L' B L' F' L F L' F' L F U' L",
            "r' U' r U' R' U R U' R' U R r' U r"
        ]
    },
    {
        "number": 47,
        "name": "OLL 47",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll47_46ead636-28d1-41d4-a8c6-1366e796a947_200x.png?v=1704585213",
        "algorithms": [
            "R' U' R' F R F' R' F R F' U R",
            "F' U' L' U L U' L' U L F",
            "R' F R F' U2 R' F R U' R' F R F'",
            "R' U' R' F R F' U R U R' U' R' F R F'"
        ]
    },
    {
        "number": 48,
        "name": "OLL 48",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll48_320fbc3c-d2d9-4060-ba58-79e05f8cdfe8_200x.png?v=1704585581",
        "algorithms": [
            "F R U R' U' R U R' U' F'",
            "R B R' U R U' R' B' R U2 R'",
            "F U R U' R' U R U' R' F'",
            "r U R' U R U2 r' U' r U R' U R U2 r'"
        ]
    },
    {
        "number": 49,
        "name": "OLL 49",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll49_f8bd5004-33a8-4c92-ae26-87a756da0012_200x.png?v=1704585018",
        "algorithms": [
            "R B' R2 F R2 B R2 F' R",
            "r U r' U R U' R' U R U' R' r U' r'",
            "R' U R U' R' F' U' F R U R' F R F'",
            "R B' R B R2 U2 F R F' R"
        ]
    },
    {
        "number": 50,
        "name": "OLL 50",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll50_80bec3d7-f696-4caa-a8e4-229809d60cba_200x.png?v=1704584186",
        "algorithms": [
            "r' U' r U' R' U R U' R' U R r' U r",
            "R' F R2 B' R2 F' R2 B R'",
            "R' U' F U R U' R' F' R U' R' U2 R",
            "L' B L' F' L F L' F' L F U' L U2 L'"
        ]
    },
    {
        "number": 51,
        "name": "OLL 51",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll51_75707b57-6d95-4a98-af32-b74734189fb7_200x.png?v=1704586093",
        "algorithms": [
            "F U R U' R' U R U' R' F'",
            "f R U R' U' R U R' U' f'",
            "R U R' U R U' B U' B' R'",
            "R' F R U R' F' R F U' F'"
        ]
    },
    {
        "number": 52,
        "name": "OLL 52",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll52_b2c788a9-5280-41f4-b6e3-430087ab4161_200x.png?v=1704584249",
        "algorithms": [
            "R U R' U R U' R' F R U R' U' F'",
            "R' U' R U' R' F' U' F U R U R' F R F'",
            "R U R' U R d' R U' R' F'",
            "R' F' U' F U' R U R' U R"
        ]
    },
    {
        "number": 53,
        "name": "OLL 53",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll53_b352beae-d4d5-4a7e-91db-d5c40d04e403_200x.png?v=1704584341",
        "algorithms": [
            "r' U' R U' R' U R U' R' U2 r",
            "r' U2 R U R' U' R U R' U r",
            "R' U2 R U R' U R2 U2 R' U' R U' R'",
            "l' U2 L U L' U L2 U2 L' U' L U' L'"
        ]
    },
    {
        "number": 54,
        "name": "OLL 54",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll54_90a20a4d-7342-4972-b10d-6dcae7777829_200x.png?v=1704586150",
        "algorithms": [
            "r U R' U R U' R' U R U2 r'",
            "r U2 R' U' R U' R' U' R U' r'",
            "R U2 R' U' R U' R2 U2 R U R' U R",
            "l U2 L' U' L U' L2 U2 L U L' U L"
        ]
    },
    {
        "number": 55,
        "name": "OLL 55",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll55_b86bbded-6dc1-453d-9dea-bd58e49f52c2_200x.png?v=1704584865",
        "algorithms": [
            "R' F R U R U' R2 F' R2 U' R' U R U R'",
            "R U2 R2 U' R U' R' U2 F R F'",
            "F R' F' R U2 R U2 R'",
            "r' U' r U' R' U R U' R' U R r' U r"
        ]
    },
    {
        "number": 56,
        "name": "OLL 56",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll56_1e4efb4d-e841-40c6-972b-d491fbfd6226_200x.png?v=1704585598",
        "algorithms": [
            "r U r' U R U' R' U R U' R' r U' r'",
            "F R U R' U' R U R' U' F'",
            "r' U r U' r' U r U' r' U r U' r' U r",
            "R' U' R U' R' U R' F R F' U R"
        ]
    },
    {
        "number": 57,
        "name": "OLL 57",
        "image": "https://www.speedcube.com.au/cdn/shop/articles/oll57_088ac901-4d45-4695-9d3a-8ec4765b7aa7_200x.png?v=1704586185",
        "algorithms": [
            "R U R' U' M' U R U' r'",
            "R U R' U' r R' U R U' r'",
            "F R U R' U' F' U' F R U R' U' F'",
            "R U R' U' R' F R2 U R' U' F'"
        ]
    }
];

// Função para exibir OLL em grid
function showCategory(category) {
    const content = document.getElementById("algorithmContent");

    if (category === "oll") {
        content.innerHTML = "";

        const grid = document.createElement("div");
        grid.id = "ollGrid";
        grid.className = "oll-grid";

        ollDataExpanded.forEach(item => {
            const card = document.createElement("div");
            card.className = "oll-card";
            card.onclick = () => openOLLModal(item);
            card.innerHTML = `
                <img src="${item.image}" alt="OLL ${item.number}">
                <div class="oll-number">OLL #${item.number}</div>
            `;
            grid.appendChild(card);
        });

        content.appendChild(grid);
    } else {
        // Exibir outras categorias
        content.innerHTML = `<h4>${category.toUpperCase()}</h4>`;
        const list = document.createElement("div");
        list.className = "algorithm-list";

        const algorithms = {
            pll: [
                "R U R' U' R' F R2 U' R' U' R U R' F'",
                "R' U L' U2 R U' R' U2 R L",
                "x R' U R' D2 R U' R' D2 R2"
            ],
            f2l: [
                "R U R'", "U R U' R'", "F R U R' U' F'", "R U2 R' U R U' R'"
            ],
            cfop: [
                "Cross: Resolva as arestas brancas intuitivamente.",
                "F2L: Combine cantos e arestas para resolver as duas primeiras camadas.",
                "OLL: Oriente a última camada com algoritmos específicos.",
                "PLL: Permute a última camada para finalizar o cubo."
            ]
        };

        if (algorithms[category]) {
            algorithms[category].forEach((alg, index) => {
                const item = document.createElement("div");
                item.className = "algorithm-item";
                item.innerHTML = `
                    <span>${alg}</span>
                    <button class="btn-copy" onclick="copyToClipboard('${alg.replace(/'/g, "\\'")}')">Copiar</button>
                `;
                list.appendChild(item);
            });
        }

        content.appendChild(list);
    }
}

// Função para abrir o modal
function openOLLModal(ollCase) {
    const modal = document.getElementById("ollModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalImage = document.getElementById("modalImage");
    const algorithmsList = document.getElementById("algorithmsList");

    // Preencher conteúdo do modal
    modalTitle.textContent = `OLL #${ollCase.number}`;
    modalImage.src = ollCase.image;
    modalImage.alt = `OLL ${ollCase.number}`;

    // Limpar e adicionar algoritmos
    algorithmsList.innerHTML = "";
    ollCase.algorithms.forEach((alg, index) => {
        const algItem = document.createElement("div");
        algItem.className = "algorithm-variant";
        algItem.innerHTML = `
            <div class="variant-header">
                <span class="variant-number">Variante ${index + 1}</span>
                <button class="btn-copy-small" onclick="copyToClipboard('${alg.replace(/'/g, "\\'")}')">
                    <i class="fas fa-copy"></i> Copiar
                </button>
            </div>
            <div class="algorithm-text">${alg}</div>
        `;
        algorithmsList.appendChild(algItem);
    });

    // Mostrar modal
    modal.style.display = "flex";
}

// Função para fechar o modal
function closeOLLModal() {
    const modal = document.getElementById("ollModal");
    modal.style.display = "none";
}

// Função para copiar algoritmo
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Feedback visual
        const btn = event.target.closest('.btn-copy-small') || event.target.closest('.btn-copy');
        if (btn) {
            const originalHTML = btn.innerHTML;
            const originalBg = btn.style.backgroundColor;
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            btn.style.backgroundColor = '#4caf50';

            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.backgroundColor = originalBg;
            }, 2000);
        }
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
        alert('Erro ao copiar algoritmo');
    });
}

// Fechar modal ao clicar fora
window.onclick = function (event) {
    const modal = document.getElementById("ollModal");
    if (event.target === modal) {
        closeOLLModal();
    }
}

// Event listener para ESC fechar modal
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeOLLModal();
    }
});