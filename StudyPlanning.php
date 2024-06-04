<?php

class StudyPlanning
{
    private $m_User;
    private $m_DbConnection;
    private $m_Filter;
    private $m_Sort;
    
    private $m_Page = 1;
    private $m_PageSize = 50;

    public function __construct(DbConnection $dbConnection, User $user)
    {
        $this->m_DbConnection = $dbConnection;
        $this->m_User = $user;

        if(isset($_POST["filter"]))
            $this->m_Filter = $_POST["filter"];

        if(isset($_POST["sort"]))
            $this->m_Sort = $_POST["sort"];

        if(isset($_POST["page"]))
            $this->m_Page = $_POST["page"];

        if(isset($_POST["page_size"]))
            $this->m_PageSize = $_POST["page_size"];
    }

    public function InvokeMethod($method, $data){
        switch($method){
            case "GetClasses": return $this->GetClasses($data); break;
            case "GetClass": return $this->GetClass($data["class_id"]); break;
            case "GetThemes": return $this->GetThemes($data); break;
            case "GetTools": return $this->GetTools($data); break;
            case "GetSchemeType": return $this->GetSchemeType($data); break;
            case "Add": return $this->Add($data); break;
            case "SaveEdit": return $this->SaveEdit($data); break;
            default: throw new Exception("Method not found", 500); break;
        }
    }

    private function GetClasses($data){
        $filterPage = $this->GetQueryFilterPage();

        $res = $this->m_DbConnection->query("
            SELECT DISTINCT ac.class_id, ac.name, ac.date_begin, ac.date_complete, 
                ac.scheme_type_id, ss.name scheme_type_name
            FROM a_class ac
                INNER JOIN s_scheme ss ON ac.scheme_type_id = ss.scheme_type_id
            $filterPage
        ", false, true);

        return $res;
    }

    private function GetClass($classId){
        $res = $this->m_DbConnection->query("
            SELECT DISTINCT ac.class_id, ac.name, ac.date_begin date_start, ac.date_complete date_end, ac.scheme_type_id
            FROM a_class ac           
            WHERE ac.class_id = $classId
        ", false, true)[0];

        $resUser = $this->m_DbConnection->query("
            SELECT DISTINCT cl.server_id, cl.user_id, u.fio, cl.team,
                jsonb_agg(jsonb_build_object('task_id', cl.task_id, 'tool_id', cl.tool_id, 'tool_name', st.name,
                                'learning_node_id', cl.learning_node_id, 'learning_node_name', ql.name)) arr_task
            FROM a_l_class_2_learning cl     
                INNER JOIN \"user\" u ON cl.server_id = u.server_id
                    AND cl.user_id = u.user_id
                INNER JOIN study_tool st ON cl.tool_id = st.tool_id
                LEFT OUTER JOIN q_learning ql ON cl.learning_node_id = ql.learning_node_id
            WHERE cl.class_id = $classId
            GROUP BY cl.server_id, cl.user_id, u.fio, cl.team
        ", false, true);

        foreach($resUser as &$user){
            $user["arr_task"] = json_decode($user["arr_task"], true);
        }

        $res["arr_user"] = $resUser;
        
        return $res;
    }

    private function GetThemes($data){
        $res = $this->m_DbConnection->query("
            SELECT st.*
            FROM study_theme st
            WHERE st.theme_type_id = 3
            LIMIT 50
        ", false, true);

        return $res;
    }

    private function GetSchemeType($data){
        return $this->m_DbConnection->query("select *from s_scheme where visible = b'1'", false, true);
    }    

    

    private function GetTools($data){
        $res = $this->m_DbConnection->query("
            SELECT DISTINCT st.tool_id, st.name, 
                jsonb_agg(jsonb_build_object(
                    'tool_id', st.tool_id, 'tool_name', st.name,
                    'block_id', ql.learning_node_id, 'block_name', ql.name, 'block_index', str.index,
                    'learning_node_id', qlf.learning_node_id, 'learning_node_name', qlf.name, 'index', strf.index
                ) ORDER BY st.name, str.index, strf.index) arr_task
            FROM study_tool st
                --Блок
                INNER JOIN l_study_tool_2_learning_node stln ON st.tool_id = stln.tool_id
                INNER JOIN l_learning_structure str ON stln.learning_node_id = str.learning_node_child_id
                INNER JOIN q_learning ql ON stln.learning_node_id = ql.learning_node_id
                --Отказ
                INNER JOIN l_learning_structure strf ON stln.learning_node_id = strf.learning_node_id
                INNER JOIN q_learning qlf ON strf.learning_node_child_id = qlf.learning_node_id
                --Доступно для назначения
                INNER JOIN q_learning_simulator_fault lsf ON qlf.learning_node_id = lsf.learning_node_id
                    AND lsf.show_trial = '1'
            WHERE st.tool_id = 33706
            GROUP BY st.tool_id, st.name
            ORDER BY st.name
        ", false, true);

        foreach($res as &$item){
            $item["arr_task"] = json_decode($item["arr_task"], true);
        }

        return $res;
    }

    private function Add($data){
        $this->m_DbConnection->query("begin");

        //Добавление занятия
        $classId = $this->m_DbConnection->query(sprintf("
            INSERT INTO a_class(class_id, name, status_id, server_id, teacher_id, scheme_type_id, date, date_begin, date_complete, added)
                SELECT COALESCE(MAX(ac.class_id), 0) + 1, $$%s$$, 1, %d, %d, %d, now(), $$%s$$, $$%s$$, now()
                FROM a_class ac
            RETURNING(class_id);
        ",  $data["name"],
            $this->m_User->GetServerId(),
            $this->m_User->GetUserId(),
            $data["scheme_type_id"],
            $data["date_start"],
            $data["date_end"]
        ))[0][0];

        $query = "";
        foreach($data["arr_user"] as $item){
            //Добавление пользователя к занятию
            $query = sprintf("
                INSERT INTO a_l_class_2_user(class_id, server_id, user_id)
                    VALUES(%d, %d, %d);
            ",  $classId,
                $this->m_User->GetServerId(),
                $item["user_id"]
            );

            if($item["arr_task"]){
                foreach($item["arr_task"] as $itemT){
                    //Добавление задания пользователя к занятию
                    $query .= sprintf("
                        INSERT INTO a_l_class_2_learning(task_id, class_id, server_id, user_id, team, tool_id, learning_node_id, status_id)
                            SELECT COALESCE(MAX(cl.task_id), 0) + 1, %d, %d, %d, %s, %d, %s, 1
                            FROM a_l_class_2_learning cl
                            WHERE cl.class_id = %d;
                    ",  $classId,
                        $this->m_User->GetServerId(),
                        $item["user_id"],
                        $item["team"] ?? "null",
                        $itemT["tool_id"],
                        $itemT["learning_node_id"] ?? "null",
                        $classId
                    );
                }        
            }
        }

        $this->m_DbConnection->exec($query);

        $err = pg_last_error();
        if ($err){
            $this->m_DbConnection->query("rollback");
            throw new Exception($err);
        }
            
        $this->m_DbConnection->query("commit");

        return [
            "class_id" => $classId
        ];
    }

    private function SaveEdit($data){

    }

    private function GetQueryFilterPage(){
        $from = ($this->m_Page - 1) * $this->m_PageSize;
        return " OFFSET $from LIMIT $this->m_PageSize ";
    }
}